import inventory from '../../data/inventory.json'
import marketplaces from '../../data/marketplaces.json'

export { inventory, marketplaces }
export type InventoryItem = (typeof inventory)[number]
export type Marketplace = (typeof marketplaces)[number]
export interface Listing {
  title: string
  description: string
}
export interface Violation {
  field: 'title' | 'description' | 'item'
  message: string
  rule?:
    | 'title_max_chars'
    | 'description_max_chars'
    | 'banned_words'
    | 'allow_html'
    | 'require_condition_in_title'
}

export function validateListing(
  item: InventoryItem,
  marketplace: Marketplace,
  listing: Listing,
): Violation[] {
  const errors: Violation[] = []
  if (/\bdo not list\b/i.test(item.name))
    errors.push({ field: 'item', message: `This item is marked do not list. ${item.notes ?? ''}` })
  for (const field of ['title', 'description'] as const)
    errors.push(...validateField(field, listing[field], marketplace))
  errors.push(...validateCondition(item, marketplace, listing.title))
  return errors
}

function validateField(
  field: 'title' | 'description',
  value: string,
  marketplace: Marketplace,
): Violation[] {
  const errors: Violation[] = []
  const label = { title: 'Title', description: 'Description' }[field]
  if (!value.trim()) errors.push({ field, message: `${label} is required.` })
  if (!marketplace.allow_html && /<(?:\/?[a-z]|!|\?)/i.test(value))
    errors.push({
      field,
      rule: 'allow_html',
      message: `HTML is not allowed in the ${field} on ${marketplace.name}. Use plain text.`,
    })
  for (const word of marketplace.banned_words) {
    if (containsTerm(value, word))
      errors.push({
        field,
        rule: 'banned_words',
        message: `Remove banned term "${word}" from the ${field}.`,
      })
  }
  const rule = field === 'title' ? 'title_max_chars' : 'description_max_chars'
  if (Array.from(value).length > marketplace[rule])
    errors.push({
      field,
      rule,
      message: `${label} exceeds ${String(marketplace[rule])} characters.`,
    })
  return errors
}

function validateCondition(
  item: InventoryItem,
  marketplace: Marketplace,
  title: string,
): Violation[] {
  if (
    marketplace.require_condition_in_title &&
    (!item.condition || !containsTerm(title, item.condition))
  )
    return [
      {
        field: 'title',
        rule: 'require_condition_in_title',
        message: item.condition
          ? `Include the full condition "${item.condition}" in the title.`
          : "This marketplace requires a condition, but this item's condition is missing.",
      },
    ]
  return []
}

function containsTerm(text: string, term: string): boolean {
  const normalized = term
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`(?<![\\p{L}\\p{N}_])${normalized}(?![\\p{L}\\p{N}_])`, 'iu').test(
    text.replace(/\s+/g, ' '),
  )
}
