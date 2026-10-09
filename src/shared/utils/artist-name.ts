// Discogs numbers homonyms: "Nirvana (2)". Display names drop the number.
export const stripDisambiguator = (name: string): string =>
  name.replace(/\s*\(\d+\)$/, '')

// What Discogs puts between the artists of a credit ("Nmesh And t e l e p a t h*")
export const CREDIT_JOIN = String.raw`\s(?:\/|\+|&|x|with|meets|vs\.?|and|feat\.?|featuring)\s|,\s`

const dedupe = (names: string[]): string[] => [
  ...new Set(names.map((name) => name.trim()).filter(Boolean)),
]

// The artists of a printed credit, Lead credit first, as printed: Name variation
// stars, disambiguators and the translated credit ("= ビートルズ*") dropped
export const creditNames = (credit: string): string[] =>
  dedupe(
    credit
      .split(' = ')[0]
      .split(new RegExp(CREDIT_JOIN, 'i'))
      .map((name) => stripDisambiguator(name.replaceAll('*', '').trim())),
  )

// The artists of a record, Lead credit first: names as printed on it (Name
// variation if any), then the canonical names they stand for
export const recordCredits = (
  artists: { name: string; anv?: string }[],
): string[] =>
  dedupe([
    ...artists.map((a) => a.anv || stripDisambiguator(a.name)),
    ...artists.map((a) => stripDisambiguator(a.name)),
  ])
