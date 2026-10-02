import { extractColors } from '#/shared/utils/extractColors'

const COLOR_MAP: Record<string, string> = {
  red: '#c0392b',
  blue: '#2980b9',
  green: '#27ae60',
  white: '#e8e8e8',
  clear: '#a0c0d0',
  transparent: '#a0c0d0',
  gold: '#f1c40f',
  yellow: '#f1c40f',
  orange: '#e67e22',
  pink: '#e91e8c',
  purple: '#8e44ad',
}

const DEFAULT_COLORS = ['#1a1a1a']

export function parseVinylColors(
  formats: Array<{ descriptions?: string[]; text?: string }>,
  formatString?: string,
): string[] {
  const found: string[] = []

  for (const fmt of formats) {
    const combined = [...(fmt.descriptions ?? []), fmt.text ?? ''].join(' ')
    for (const name of extractColors(combined)) {
      const hex = COLOR_MAP[name]
      if (hex && !found.includes(hex)) found.push(hex)
    }
  }

  if (found.length === 0 && formatString) {
    for (const name of extractColors(formatString)) {
      const hex = COLOR_MAP[name]
      if (hex && !found.includes(hex)) found.push(hex)
    }
  }

  return found.length > 0 ? found : DEFAULT_COLORS
}

// Format tags of a Master: its Main release's, then every other Release's
export type MasterTags = { main: string[]; others: string[] }

const NON_STUDIO_FORMATS = [
  'Compilation',
  'Live',
  'Unofficial Release',
  'Box Set',
]

// Tags on the Main release that settle a Master's kind without looking at other Releases
const CONCLUSIVE_FORMATS = [
  'Album',
  'EP',
  'Single',
  'Maxi-Single',
  ...NON_STUDIO_FORMATS,
]

// Format tags miss some live records and compilations, so titles are checked too
const NON_STUDIO_TITLE =
  /\b(live (at|in|from)|unplugged|best of|greatest hits|remix(es|ed))\b|\(live\)/i

// The Main release decides; other Releases only fill in when it carries neither tag
function masterKind({ main, others }: MasterTags): 'album' | 'ep' | null {
  for (const formats of [main, others]) {
    if (formats.includes('Album')) return 'album'
    if (formats.includes('EP')) return 'ep'
  }
  return null
}

export function isStudioAlbum(title: string, tags: MasterTags): boolean {
  return (
    masterKind(tags) === 'album' &&
    !tags.main.some((f) => NON_STUDIO_FORMATS.includes(f)) &&
    !NON_STUDIO_TITLE.test(title)
  )
}

export function isEp(tags: MasterTags): boolean {
  return masterKind(tags) === 'ep'
}

// Caps the extra Discogs requests spent classifying one artist's Discography
export const MAX_VERSION_LOOKUPS = 20

// Search results only carry Main release tags, and miss Masters credited under name variations
export function needsVersionLookup(mainFormats: string[] | undefined): boolean {
  return !mainFormats?.some((f) => CONCLUSIVE_FORMATS.includes(f))
}
