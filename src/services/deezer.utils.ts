const sanitizeBase = (text: string): string =>
  text
    .replace(/[≤≥≠∞←→↑↓§©®™°•…]/g, '')
    .replace(/\[.*?\]/g, '')
    .trim()
    .replace(/\s+/g, ' ')

export const cleanTitle = (title: string): string =>
  sanitizeBase(title)
    .replace(
      /\s*\(.*?(?:anniversary|remaster(?:ed)?|edition|deluxe|expanded|bonus|version|soundtrack|score|themes?|ost).*?\)\s*$/i,
      '',
    )
    .trim()

// For query construction — preserves special chars (≤, æ, ø…) that Deezer needs
// to find the right artist. Only strips what breaks field syntax.
export const queryArtist = (artist: string): string =>
  artist
    .replace(/\[.*?\]/g, '')
    .replace(/\s*\(\d+\)\s*$/, '')
    .replace(/["!]/g, '')
    .trim()
    .replace(/\s+/g, ' ')

export const queryTitle = (title: string): string => title.replace(/"/g, '')

export const stripSubtitle = (title: string): string =>
  title.replace(/\s+[-:]\s+.+$/, '').trim() || title

const ROMAN_RE = /\b(VIII|VII|VI|IV|IX|III|II|I|V|X)\b/g
const ROMAN_MAP: Record<string, number> = {
  I: 1,
  II: 2,
  III: 3,
  IV: 4,
  V: 5,
  VI: 6,
  VII: 7,
  VIII: 8,
  IX: 9,
  X: 10,
}

const normalizeNumerals = (text: string): string =>
  text.replace(ROMAN_RE, (m) => String(ROMAN_MAP[m]))

const LATIN_EXT: Record<string, string> = {
  æ: 'ae',
  Æ: 'ae',
  œ: 'oe',
  Œ: 'oe',
  ø: 'o',
  Ø: 'o',
  ð: 'd',
  Ð: 'd',
  þ: 'th',
  Þ: 'th',
  ł: 'l',
  Ł: 'l',
  ß: 'ss',
}

const transliterateLatinExt = (text: string): string =>
  [...text].map((c) => LATIN_EXT[c] ?? c).join('')

// Han, kana and hangul write words without spaces: they compare by
// overlapping pairs of characters, the usual way to search CJK text
const CJK_RUN_RE =
  /([\p{sc=Han}\p{sc=Hiragana}\p{sc=Katakana}\p{sc=Hangul}ー]+)/u
const CJK_RE = /^[\p{sc=Han}\p{sc=Hiragana}\p{sc=Katakana}\p{sc=Hangul}ー]/u

const bigrams = (run: string): string[] => {
  const chars = [...run]
  if (chars.length < 2) return chars
  return chars.slice(1).map((c, i) => chars[i] + c)
}

// Spaced-out names ("t e l e p a t h") read as one word
const joinSpacedLetters = (words: string[]): string[] =>
  words.reduce<string[]>((joined, word, i) => {
    const spaced = [...word].length === 1 && /\p{L}/u.test(word)
    const prevSpaced = i > 0 && [...words[i - 1]].length === 1
    if (spaced && prevSpaced && /\p{L}/u.test(words[i - 1]))
      joined[joined.length - 1] += word
    else joined.push(word)
    return joined
  }, [])

// Cyrillic letters standing in for Latin ones in a stylised name ("KoЯn")
const FAUX_LATIN: Record<string, string> = {
  я: 'r',
  и: 'n',
  д: 'a',
  ш: 'w',
  ц: 'u',
  ф: 'o',
  а: 'a',
  е: 'e',
  о: 'o',
  с: 'c',
  к: 'k',
  м: 'm',
  т: 't',
  х: 'x',
}

const readFauxLatin = (word: string): string =>
  /[a-z]/.test(word) ? [...word].map((c) => FAUX_LATIN[c] ?? c).join('') : word

export const tokenize = (text: string): Set<string> => {
  const words = normalizeNumerals(
    transliterateLatinExt(
      text.normalize('NFKC').normalize('NFD').replace(/\p{M}/gu, ''),
    ),
  )
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean)
  return new Set(
    joinSpacedLetters(words).flatMap((word) =>
      readFauxLatin(word)
        .split(CJK_RUN_RE)
        .filter(Boolean)
        .flatMap((run) => (CJK_RE.test(run) ? bigrams(run) : [run])),
    ),
  )
}

// Token Jaccard, any script. Nothing in common, or nothing to compare, is 0:
// a wrong Cover is worse than a House sleeve
export const similarity = (a: string, b: string): number => {
  const ta = tokenize(a)
  const tb = tokenize(b)
  if (ta.size === 0 || tb.size === 0) return 0
  const intersection = [...ta].filter((t) => tb.has(t)).length
  const union = new Set([...ta, ...tb]).size
  return intersection / union
}
