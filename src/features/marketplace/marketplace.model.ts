import type {
  MarketplaceStatsResponse,
  PriceSuggestionsResponse,
} from './marketplace.schema'

export type Price = { value: number; currency: string }

export type MarketplaceStats =
  | { status: 'blocked' }
  | { status: 'listed'; listingCount: number; lowestPrice: Price | null }

export type SuggestedPrice = { condition: string; price: Price }

// Conditions shown, best first. Lower grades are noise for buyers.
const SUGGESTED_CONDITIONS = [
  { key: 'Mint (M)', label: 'M' },
  { key: 'Near Mint (NM or M-)', label: 'NM' },
  { key: 'Very Good Plus (VG+)', label: 'VG+' },
] as const

export const toMarketplaceStats = (
  stats: MarketplaceStatsResponse,
): MarketplaceStats => {
  if (stats.blocked_from_sale) return { status: 'blocked' }
  const listingCount = stats.num_for_sale ?? 0
  return {
    status: 'listed',
    listingCount,
    lowestPrice: listingCount > 0 ? stats.lowest_price : null,
  }
}

export const toSuggestedPrices = (
  suggestions: PriceSuggestionsResponse,
): SuggestedPrice[] =>
  SUGGESTED_CONDITIONS.flatMap(({ key, label }) => {
    const price = suggestions[key]
    return price && price.value > 0 ? [{ condition: label, price }] : []
  })
