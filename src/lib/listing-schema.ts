import { z } from 'zod'

export const listingSchema = z.object({ title: z.string(), description: z.string() })
export const selectionSchema = z.object({
  sku: z.string().min(1),
  marketplaceId: z.string().min(1),
})
