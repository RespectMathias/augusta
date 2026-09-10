import { useState } from 'react'
import { validateListing, type InventoryItem, type Listing, type Marketplace } from '@/lib/listings'

type ApprovedListing = Listing & { sku: string; marketplaceId: string }
export interface WorkspaceProps {
  inventory: InventoryItem[]
  marketplaces: Marketplace[]
}

export function useInventoryWorkspace({ inventory, marketplaces }: WorkspaceProps) {
  const [view, setView] = useState<'inventory' | 'item' | 'approved'>('inventory')
  const [sku, setSku] = useState(inventory[0].sku)
  const [marketplaceId, setMarketplaceId] = useState(marketplaces[0].id)
  const [drafts, setDrafts] = useState<Record<string, Listing | undefined>>({})
  const [approved, setApproved] = useState<Record<string, ApprovedListing | undefined>>({})
  const approvedEntries = Object.values(approved).filter(
    (entry): entry is ApprovedListing => entry !== undefined,
  )
  const itemIndex = inventory.findIndex((entry) => entry.sku === sku)
  const item = inventory[itemIndex]
  const marketplace = marketplaces.find((entry) => entry.id === marketplaceId) ?? marketplaces[0]
  const key = `${sku}:${marketplaceId}`
  const snapshot = approved[key]
  function openItem(nextSku: string, nextMarketplace = marketplaceId) {
    setSku(nextSku)
    setMarketplaceId(nextMarketplace)
    setView('item')
  }
  function changeDraft(listing: Listing) {
    setDrafts((current) => ({ ...current, [key]: listing }))
  }
  function approve(listing: Listing) {
    setApproved((current) => ({ ...current, [key]: { ...listing, sku, marketplaceId } }))
    setDrafts((current) => ({ ...current, [key]: undefined }))
  }
  function editSnapshot() {
    if (!snapshot) return
    changeDraft({ title: snapshot.title, description: snapshot.description })
    setApproved((current) =>
      Object.fromEntries(Object.entries(current).filter(([entryKey]) => entryKey !== key)),
    )
  }
  function status(entry: InventoryItem) {
    const entryKey = `${entry.sku}:${marketplaceId}`
    return listingStatus(entry, marketplace, drafts[entryKey], approved[entryKey])
  }
  return {
    view,
    setView,
    marketplaceId,
    setMarketplaceId,
    approvedEntries,
    itemIndex,
    item,
    marketplace,
    key,
    snapshot,
    draft: drafts[key],
    openItem,
    changeDraft,
    approve,
    editSnapshot,
    status,
  }
}

export type WorkspaceState = ReturnType<typeof useInventoryWorkspace>

function listingStatus(
  item: InventoryItem,
  marketplace: Marketplace,
  draft?: Listing,
  approved?: ApprovedListing,
) {
  const errors = validateListing(item, marketplace, draft ?? { title: '', description: '' })
  if (
    errors.some((error) => error.field === 'item') ||
    (marketplace.require_condition_in_title && !item.condition)
  )
    return 'Blocked'
  if (approved) return 'Approved'
  return draft ? 'Draft' : 'Not started'
}
