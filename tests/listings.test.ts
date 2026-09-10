import { describe, expect, it } from 'vitest'
import { inventory, marketplaces, validateListing } from '../src/lib/listings'

const item = inventory[0]
const dba = marketplaces[0]
const ebay = marketplaces[2]
const amazon = marketplaces[1]
const valid = { title: 'New Bosch drill', description: '18V drill. Battery not included.' }

describe('listing approval rules', () => {
  it('accepts the exact title limit and rejects the next character', () => {
    expect(validateListing(item, dba, { ...valid, title: 'a'.repeat(80) })).toEqual([])
    expect(validateListing(item, dba, { ...valid, title: 'a'.repeat(81) })).toEqual(
      expect.arrayContaining([expect.objectContaining({ field: 'title' })]),
    )
  })
  it.each(['CHEAP!', 'A billig drill'])('blocks whole banned words: %s', (description) => {
    expect(validateListing(item, dba, { ...valid, description })).toHaveLength(1)
  })
  it('allows substrings inside longer words', () => {
    expect(validateListing(item, dba, { ...valid, description: 'The cheapest option' })).toEqual([])
  })
  it('matches phrases across whitespace and punctuation entries literally', () => {
    expect(validateListing(item, amazon, { ...valid, title: 'BEST   PRICE drill' })).toHaveLength(1)
    expect(validateListing(item, ebay, { ...valid, description: 'L@@K!' })).toHaveLength(1)
  })
  it('requires the full condition, normalizing case and whitespace', () => {
    const used = inventory[10]
    expect(validateListing(used, ebay, { ...valid, title: 'SSD used' })).toHaveLength(1)
    expect(validateListing(used, ebay, { ...valid, title: 'SSD USED  - LIKE NEW' })).toEqual([])
    expect(validateListing(item, ebay, { ...valid, title: 'Renewed drill' })).toHaveLength(1)
  })
  it('blocks missing conditions only when required', () => {
    const unknown = inventory[6]
    expect(validateListing(unknown, ebay, valid)).toHaveLength(1)
    expect(validateListing(unknown, dba, valid)).toEqual([])
  })
  it('blocks do-not-list inventory independently of marketplace rules', () => {
    expect(validateListing(inventory[11], dba, valid)).toEqual(
      expect.arrayContaining([expect.objectContaining({ field: 'item' })]),
    )
  })
  it('rejects blank fields', () => {
    expect(validateListing(item, dba, { title: ' ', description: '\n' })).toHaveLength(2)
  })
  it('enforces the description boundary', () => {
    expect(validateListing(item, dba, { ...valid, description: 'a'.repeat(1000) })).toEqual([])
    expect(validateListing(item, dba, { ...valid, description: 'a'.repeat(1001) })).toEqual([
      expect.objectContaining({ field: 'description' }),
    ])
  })
  it('counts Unicode code points consistently at the title boundary', () => {
    expect(validateListing(item, dba, { ...valid, title: '🔧'.repeat(80) })).toEqual([])
    expect(validateListing(item, dba, { ...valid, title: '🔧'.repeat(81) })).toHaveLength(1)
  })
  it.each(['<b>Drill</b>', '<!-- comment -->', '<img src=x', '<!DOCTYPE html>'])(
    'blocks HTML markup on DBA: %s',
    (description) => {
      expect(validateListing(item, dba, { ...valid, description })).toEqual([
        expect.objectContaining({ field: 'description' }),
      ])
    },
  )
  it('permits plain comparisons and HTML on marketplaces that allow it', () => {
    expect(validateListing(item, dba, { ...valid, description: 'Weight < 2 kg' })).toEqual([])
    expect(validateListing(item, amazon, { ...valid, description: '<b>Drill</b>' })).toEqual([])
  })
})
