import { inventory, marketplaces } from './listings'
import { selectionSchema } from './listing-schema'

export async function readSelection(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return { response: Response.json({ error: 'Send a valid JSON request.' }, { status: 400 }) }
  }
  const parsed = selectionSchema.safeParse(body)
  if (!parsed.success)
    return {
      response: Response.json(
        { error: 'Choose an inventory item and marketplace.' },
        { status: 400 },
      ),
    }
  const item = inventory.find((entry) => entry.sku === parsed.data.sku)
  const marketplace = marketplaces.find((entry) => entry.id === parsed.data.marketplaceId)
  if (!item || !marketplace)
    return { response: Response.json({ error: 'Item or marketplace not found.' }, { status: 404 }) }
  return { item, marketplace, body }
}
