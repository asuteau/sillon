import { stripDisambiguator } from '#/shared/utils/artist-name'
import { formatYear } from '#/shared/utils/list-sort'
import type { SortKey } from '#/shared/utils/list-sort'

export function formatDateAdded(dateAdded: string): string {
  return new Date(dateAdded).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

// A row's catalogue line: the year when sorted by year, else the date added
export const formatListMeta = (
  release: { date_added: string; basic_information: { year: number } },
  sort: SortKey,
): string =>
  sort === 'year'
    ? formatYear(release.basic_information.year)
    : formatDateAdded(release.date_added)

export function formatArtists(artists: { name: string }[]): string {
  return artists.map((a) => stripDisambiguator(a.name)).join(', ')
}

// The first credited artist, for House sleeves
export function leadArtist(artists: { name: string }[]): string {
  return stripDisambiguator(artists[0]?.name ?? '')
}

// Parses a Discogs amount such as "€1,240.52" or "¥12,345".
// A separator followed by exactly two trailing digits is the decimal point.
export function parseAmount(amount: string): number | null {
  const digits = amount.replace(/[^\d.,]/g, '')
  if (!/\d/.test(digits)) return null
  const decimal = /[.,](\d{2})$/.exec(digits)
  const integer = (decimal ? digits.slice(0, decimal.index) : digits).replace(
    /[.,]/g,
    '',
  )
  return Number(decimal ? `${integer}.${decimal[1]}` : integer)
}

// Compact, e.g. "€850", "€1.2K", "€3.4M". One decimal only from 1K up.
export function formatAmount(
  amount: number,
  currency: string,
  locale?: string,
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    notation: 'compact',
    minimumFractionDigits: 0,
    maximumFractionDigits: Math.abs(amount) < 1000 ? 0 : 1,
  }).format(amount)
}

export { formatRecords } from '#/shared/utils/format-records'
