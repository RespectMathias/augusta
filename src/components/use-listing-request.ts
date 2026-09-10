import { useEffect, useRef, useState } from 'react'
import { z } from 'zod'
import { listingSchema, selectionSchema } from '@/lib/listing-schema'
import { validateListing, type InventoryItem, type Listing, type Marketplace } from '@/lib/listings'

type Action = 'generate' | 'approve'
export interface EditorProps {
  item: InventoryItem
  marketplace: Marketplace
  draft?: Listing
  onChange: (listing: Listing) => void
  onApprove: (listing: Listing) => void
}

function responseError(body: unknown) {
  if (body && typeof body === 'object' && 'error' in body && typeof body.error === 'string')
    return body.error
  return 'Request failed. Try again.'
}

const generatedSchema = z.object({ listing: listingSchema }).transform((body) => body.listing)

function parseResponse(body: unknown, action: Action, { item, marketplace }: EditorProps) {
  const parsed = (action === 'generate' ? generatedSchema : listingSchema).safeParse(body)
  if (!parsed.success) throw new Error('The server returned an invalid listing. Try again.')
  if (action === 'approve') {
    const selection = selectionSchema.safeParse(body)
    if (
      !selection.success ||
      selection.data.sku !== item.sku ||
      selection.data.marketplaceId !== marketplace.id ||
      validateListing(item, marketplace, parsed.data).length
    )
      throw new Error('Approval response is invalid. Try again.')
  }
  return parsed.data
}

async function requestListing(action: Action, props: EditorProps, signal: AbortSignal) {
  const response = await fetch(`/api/listings/${action}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sku: props.item.sku,
      marketplaceId: props.marketplace.id,
      ...(action === 'approve' ? props.draft : {}),
    }),
    signal: AbortSignal.any([signal, AbortSignal.timeout(40_000)]),
  })
  const body: unknown = await response.json()
  if (!response.ok) throw new Error(responseError(body))
  return parseResponse(body, action, props)
}

export function useListingRequest(props: EditorProps) {
  const [busy, setBusy] = useState<Action | null>(null)
  const [error, setError] = useState<string | null>(null)
  const pending = useRef<AbortController | null>(null)
  useEffect(() => () => pending.current?.abort(), [])
  const violations = validateListing(
    props.item,
    props.marketplace,
    props.draft ?? { title: '', description: '' },
  )
  const itemErrors = violations.filter((entry) => entry.field === 'item')
  const canGenerate = busy === null && itemErrors.length === 0
  const canApprove = busy === null && Boolean(props.draft) && violations.length === 0
  const allowed = { generate: canGenerate, approve: canApprove }

  async function submit(action: Action) {
    if (pending.current || !allowed[action]) return
    const controller = new AbortController()
    pending.current = controller
    setBusy(action)
    setError(null)
    try {
      const listing = await requestListing(action, props, controller.signal)
      if (controller.signal.aborted) return
      if (action === 'generate') props.onChange(listing)
      else props.onApprove(listing)
    } catch (failure) {
      if (!controller.signal.aborted)
        setError(failure instanceof Error ? failure.message : 'Request failed. Try again.')
    } finally {
      if (!controller.signal.aborted) {
        pending.current = null
        setBusy(null)
      }
    }
  }
  return { busy, error, setError, violations, itemErrors, canGenerate, canApprove, submit }
}
