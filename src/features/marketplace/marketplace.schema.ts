import { z } from 'zod'

const PriceSchema = z.object({
  currency: z.string(),
  value: z.number(),
})

export const MarketplaceStatsSchema = z.object({
  lowest_price: PriceSchema.nullable(),
  num_for_sale: z.number().nullable(),
  blocked_from_sale: z.boolean(),
})

export type MarketplaceStatsResponse = z.infer<typeof MarketplaceStatsSchema>

// Keyed by condition label, e.g. "Very Good Plus (VG+)"
// Values optional: a condition may be missing
export const PriceSuggestionsSchema = z.record(
  z.string(),
  PriceSchema.optional(),
)

export type PriceSuggestionsResponse = z.infer<typeof PriceSuggestionsSchema>
