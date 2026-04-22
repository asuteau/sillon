const sanitizeBase = (text: string): string =>
  text
    .replace(/[≤≥≠∞←→↑↓§©®™°•…]/g, '')
    .replace(/\[.*?\]/g, '')
    .trim()
    .replace(/\s+/g, ' ')

export const cleanArtist = (artist: string): string =>
  sanitizeBase(artist)
    .replace(/\s*\(\d+\)\s*$/, '')
    .trim()

export const cleanTitle = (title: string): string =>
  sanitizeBase(title)
    .replace(
      /\s*\(.*?(?:anniversary|remaster(?:ed)?|edition|deluxe|expanded|bonus|version).*?\)\s*$/i,
      '',
    )
    .trim()
