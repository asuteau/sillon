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

const NON_STUDIO_FORMATS = [
  'Compilation',
  'Live',
  'Unofficial Release',
  'Box Set',
]

// Format tags miss some live records and compilations, so titles are checked too
const NON_STUDIO_TITLE = /\b(unplugged|live|best of|greatest hits|remixes)\b/i

export function isStudioAlbum(title: string, formats: string[]): boolean {
  return (
    formats.includes('Album') &&
    !formats.some((f) => NON_STUDIO_FORMATS.includes(f)) &&
    !NON_STUDIO_TITLE.test(title)
  )
}
