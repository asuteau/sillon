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
