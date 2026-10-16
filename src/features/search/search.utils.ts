import { CREDIT_JOIN } from '#/shared/utils/artist-name'

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

export type CreditReading = 'credited' | 'unclear' | 'uncredited'

const sameName = (a: string, b: string): boolean =>
  a.localeCompare(b, undefined, { sensitivity: 'accent' }) === 0

// Search matches artists by name, so homonyms ("The Beatles (4)") and tributes are weeded out.
// Discogs stars a Name variation, so only the canonical name or a starred variation is sure;
// a name that stands whole in a longer credit may be a collaboration or another artist's name
export const readCredit = (
  credit: string,
  artist: { name: string; variations: string[] },
): CreditReading => {
  // Drops the translated credit ("The Beatles = ビートルズ*")
  const main = credit.split(' = ')[0].trim()
  const isStarred = main.endsWith('*')
  const bare = isStarred ? main.slice(0, -1) : main
  if (
    (!isStarred && sameName(bare, artist.name)) ||
    (isStarred && artist.variations.some((name) => sameName(bare, name)))
  ) {
    return 'credited'
  }

  const unstarred = main.replaceAll('*', '')
  const appears = [artist.name, ...artist.variations].some((name) =>
    new RegExp(
      `(?:^|${CREDIT_JOIN})${escapeRegExp(name)}(?:$|${CREDIT_JOIN})`,
      'i',
    ).test(unstarred),
  )
  return appears ? 'unclear' : 'uncredited'
}
