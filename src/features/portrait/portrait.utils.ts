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

export const formatRecords = (count: number) =>
  `${count.toLocaleString()} ${count === 1 ? 'record' : 'records'}`
