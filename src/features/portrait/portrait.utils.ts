import type { EstimatedValue } from '#/features/collection/collection.model'
import { formatAmount } from '#/features/collection/collection.utils'

// Headline is the median; the range signals the uncertainty
export const formatEstimatedValue = (
  value: EstimatedValue,
  currency: string,
  locale?: string,
): { median: string; range: string } | null => {
  if (!value) return null
  return {
    median: `≈ ${formatAmount(value.median, currency, locale)}`,
    range: `${formatAmount(value.minimum, currency, locale)} – ${formatAmount(value.maximum, currency, locale)}`,
  }
}

export const formatRecordCount = (count: number, locale?: string): string =>
  `${count.toLocaleString(locale)} ${count === 1 ? 'record' : 'records'}`

interface TeaserFigures {
  value: EstimatedValue
  currency: string
  recordCount: number
}

// Home's one line, from the figures Discogs gives whole
export const portraitTeaser = (
  { value, currency, recordCount }: TeaserFigures,
  locale?: string,
): string => {
  const estimate = formatEstimatedValue(value, currency, locale)
  const count = formatRecordCount(recordCount, locale)
  return estimate ? `${estimate.median} · ${count}` : count
}
