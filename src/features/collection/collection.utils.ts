export function formatDateAdded(dateAdded: string): string {
  return new Date(dateAdded).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function formatArtists(artists: { name: string }[]): string {
  return artists.map((a) => a.name).join(', ')
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

export function formatAmount(amount: number, currency: string): string {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}
