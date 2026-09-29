import type { Price } from './marketplace.model'

// Exact, e.g. "€14.50", "€8", "¥1,200". Cents only when there are some.
export const formatPrice = (price: Price, locale?: string): string => {
  const hasCents = !Number.isInteger(price.value)
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: price.currency,
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: hasCents ? 2 : 0,
  }).format(price.value)
}

export const discogsListingsUrl = (releaseId: number): string =>
  `https://www.discogs.com/sell/release/${releaseId}`
