export const cleanArtist = (artist: string): string =>
  // Strip Discogs disambiguation suffix: "Turnstile (2)" → "Turnstile"
  artist.replace(/\s*\(\d+\)\s*$/, '').trim()

export const cleanTitle = (title: string): string =>
  // Strip edition/remaster qualifiers that won't match Deezer catalog titles
  title
    .replace(
      /\s*\(.*?(?:anniversary|remaster(?:ed)?|edition|deluxe|expanded|bonus|version).*?\)\s*$/i,
      '',
    )
    .trim()
