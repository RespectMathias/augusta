import { readSelection } from '@/lib/listing-request'
import { listingSchema } from '@/lib/listing-schema'
import { validateListing } from '@/lib/listings'

export async function POST(request: Request): Promise<Response> {
  const selection = await readSelection(request)
  if (selection.response) return selection.response
  const parsed = listingSchema.safeParse(selection.body)
  if (!parsed.success)
    return Response.json({ error: 'Title and description must be strings.' }, { status: 400 })
  const { item, marketplace } = selection
  const violations = validateListing(item, marketplace, parsed.data)
  if (violations.length)
    return Response.json(
      { error: "Fix the listing's rule violations before approval.", violations },
      { status: 422 },
    )
  return Response.json({ sku: item.sku, marketplaceId: marketplace.id, ...parsed.data })
}
