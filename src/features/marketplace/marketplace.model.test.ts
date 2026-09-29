import { describe, expect, it } from 'vitest'

import { toMarketplaceStats, toSuggestedPrices } from './marketplace.model'

const eur = (value: number) => ({ currency: 'EUR', value })

describe('toMarketplaceStats', () => {
  it('maps Listings and Lowest price', () => {
    expect(
      toMarketplaceStats({
        lowest_price: eur(14.5),
        num_for_sale: 12,
        blocked_from_sale: false,
      }),
    ).toEqual({ status: 'listed', listingCount: 12, lowestPrice: eur(14.5) })
  })

  it('drops the Lowest price when nothing is listed', () => {
    expect(
      toMarketplaceStats({
        lowest_price: eur(14.5),
        num_for_sale: 0,
        blocked_from_sale: false,
      }),
    ).toEqual({ status: 'listed', listingCount: 0, lowestPrice: null })
  })

  it('treats a missing count as no Listings', () => {
    expect(
      toMarketplaceStats({
        lowest_price: null,
        num_for_sale: null,
        blocked_from_sale: false,
      }),
    ).toEqual({ status: 'listed', listingCount: 0, lowestPrice: null })
  })

  it('reports releases blocked from sale', () => {
    expect(
      toMarketplaceStats({
        lowest_price: null,
        num_for_sale: 0,
        blocked_from_sale: true,
      }),
    ).toEqual({ status: 'blocked' })
  })
})

describe('toSuggestedPrices', () => {
  it('keeps M, NM and VG+ only, best first', () => {
    expect(
      toSuggestedPrices({
        'Very Good (VG)': eur(12),
        'Very Good Plus (VG+)': eur(19),
        'Mint (M)': eur(32),
        'Near Mint (NM or M-)': eur(28),
        'Poor (P)': eur(2),
      }),
    ).toEqual([
      { condition: 'M', price: eur(32) },
      { condition: 'NM', price: eur(28) },
      { condition: 'VG+', price: eur(19) },
    ])
  })

  it('skips missing and zero suggestions', () => {
    expect(
      toSuggestedPrices({ 'Mint (M)': eur(0), 'Very Good Plus (VG+)': eur(9) }),
    ).toEqual([{ condition: 'VG+', price: eur(9) }])
  })

  it('returns nothing for an empty response', () => {
    expect(toSuggestedPrices({})).toEqual([])
  })
})
