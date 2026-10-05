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

// Format tags miss some live records, compilations and demos, so titles are checked too
const NON_STUDIO_TITLE =
  /\b(live[!:]?\s+(at|in|from)|live recordings?|unplugged|best of|greatest hits|remix(es|ed)|demos?|bootleg)\b|\(live\)/i

// Classification reads the Main release's format tags only
export const isStudioAlbum = (title: string, formats: string[]): boolean =>
  formats.includes('Album') &&
  !formats.some((f) => NON_STUDIO_FORMATS.includes(f)) &&
  !NON_STUDIO_TITLE.test(title)

export const isEp = (formats: string[]): boolean =>
  formats.includes('EP') &&
  !formats.includes('Album') &&
  !formats.includes('Unofficial Release')

export const isCompilation = (formats: string[]): boolean =>
  formats.includes('Compilation') && !formats.includes('Unofficial Release')

const escapeRegExp = (text: string): string =>
  text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const CREDIT_JOIN = String.raw`\s(?:\/|\+|&|x|with|meets|vs\.?|and|feat\.?|featuring)\s|,\s`

// Search matches artists by name, so homonyms ("The Beatles (4)") and tributes are weeded out:
// one of the artist's names must stand whole in the credit, alone or joined to another artist
export const isCreditedTo = (credit: string, names: string[]): boolean => {
  // Drops the translated credit ("The Beatles = ビートルズ*") and name variation stars
  const normalized = credit.split(' = ')[0].replaceAll('*', '').trim()
  return names.some((name) =>
    new RegExp(
      `(?:^|${CREDIT_JOIN})${escapeRegExp(name)}(?:$|${CREDIT_JOIN})`,
      'i',
    ).test(normalized),
  )
}
