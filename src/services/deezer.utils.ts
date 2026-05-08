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

export const firstArtist = (artist: string): string =>
  cleanArtist(artist)
    .split(/\s+\/\s+|,/)
    .at(0)!
    .trim()

// For query construction — preserves special chars (≤, æ, ø…) that Deezer needs
// to find the right artist. Only strips double quotes which break field syntax.
export const queryArtist = (artist: string): string =>
  artist
    .replace(/\[.*?\]/g, '')
    .replace(/\s*\(\d+\)\s*$/, '')
    .replace(/"/g, '')
    .trim()
    .replace(/\s+/g, ' ')
    .split(/\s+\/\s+|,/)
    .at(0)!
    .trim()

export const stripSubtitle = (title: string): string =>
  title.replace(/\s+[-:]\s+.+$/, '').trim() || title

const ROMAN_RE = /\b(VIII|VII|VI|IV|IX|III|II|I|V|X)\b/g
const ROMAN_MAP: Record<string, number> = {
  I: 1, II: 2, III: 3, IV: 4, V: 5,
  VI: 6, VII: 7, VIII: 8, IX: 9, X: 10,
}

const normalizeNumerals = (text: string): string =>
  text.replace(ROMAN_RE, (m) => String(ROMAN_MAP[m]))

const LATIN_EXT: Record<string, string> = {
  æ: 'ae', Æ: 'ae', œ: 'oe', Œ: 'oe',
  ø: 'o', Ø: 'o', ð: 'd', Ð: 'd', þ: 'th', Þ: 'th',
  ł: 'l', Ł: 'l', ß: 'ss',
}

const transliterateLatinExt = (text: string): string =>
  [...text].map((c) => LATIN_EXT[c] ?? c).join('')

export const tokenize = (text: string): Set<string> =>
  new Set(
    normalizeNumerals(
      transliterateLatinExt(
        text.normalize('NFKC').normalize('NFD').replace(/[̀-ͯ]/g, ''),
      ),
    )
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(Boolean),
  )

const isMixedScript = (text: string): boolean =>
  /[a-zA-Z]/.test(text) && /[^\x00-\x7F]/.test(text)

export const jaccardSimilarity = (a: string, b: string): number => {
  const ta = tokenize(a)
  const tb = tokenize(b)
  // if either side has no Latin/ASCII tokens (e.g. Japanese title), trust the query
  if (ta.size === 0 || tb.size === 0) return 1
  const intersection = [...ta].filter((t) => tb.has(t)).length
  const union = new Set([...ta, ...tb]).size
  const jaccard = intersection / union
  // if tokens don't overlap but one string mixes Latin with non-ASCII (e.g. KoЯn),
  // the mismatch is from stripping stylistic characters — trust the query
  if (jaccard === 0 && (isMixedScript(a) || isMixedScript(b))) return 0.7
  return jaccard
}
