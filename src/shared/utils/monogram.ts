import { stripDisambiguator } from '#/shared/utils/artist-name'

const ARTICLES = new Set(['the', 'les', 'die'])
const LATIN_LETTER = /^\p{Script=Latin}$/u

const initial = (word: string) => Array.from(word)[0] ?? ''

// An artist's Monogram (see CONTEXT.md): up to two Latin initials, or the
// first character as written when the name starts with anything else
export const monogram = (name: string): string => {
  const words = stripDisambiguator(name).split(/\s+/).filter(Boolean)
  const named =
    words.length > 1 && ARTICLES.has(words[0].toLowerCase())
      ? words.slice(1)
      : words

  const first = initial(named[0] ?? '')
  if (!LATIN_LETTER.test(first)) return first

  const second = named
    .slice(1)
    .map(initial)
    .find((char) => LATIN_LETTER.test(char))
  return (first + (second ?? '')).toLocaleUpperCase()
}
