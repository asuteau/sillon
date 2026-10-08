// Discogs numbers homonyms: "Nirvana (2)". Display names drop the number.
export const stripDisambiguator = (name: string): string =>
  name.replace(/\s*\(\d+\)$/, '')
