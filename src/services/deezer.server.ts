import {
  cleanTitle,
  queryArtist,
  queryTitle,
  similarity,
  stripSubtitle,
  tokenize,
} from '#/services/deezer.utils'
import { z } from 'zod'

const ARTIST_THRESHOLD = 0.5
const ALBUM_THRESHOLD = 0.3
const RESULTS_PER_QUERY = 10
// For a whole lookup, every query included: past it the lookup fails like any
// Deezer error, so it isn't remembered and the record shows a House sleeve
const LOOKUP_TIMEOUT_MS = 5000

const DeezerSearchSchema = z.object({
  data: z.array(
    z.object({
      title: z.string().nullish(),
      cover_xl: z.string().nullish(),
      cover_big: z.string().nullish(),
      artist: z.object({ name: z.string() }).nullish(),
    }),
  ),
})

type Candidate = {
  artistName: string
  albumTitle: string
  coverUrl: string | null
}

const deezerSearch = async (
  q: string,
  signal: AbortSignal,
): Promise<Candidate[]> => {
  const res = await fetch(
    `https://api.deezer.com/search/album?q=${encodeURIComponent(q)}&limit=${RESULTS_PER_QUERY}`,
    { headers: { 'User-Agent': 'Sillon/1.0' }, signal },
  )
  // Throws on failure (network, quota, bad payload) so it's never mistaken
  // for "no match", which callers remember
  if (!res.ok) throw new Error(`Deezer search failed: ${res.status}`)
  const json = DeezerSearchSchema.parse(await res.json())
  return json.data.map((item) => ({
    artistName: item.artist?.name ?? '',
    albumTitle: item.title ?? '',
    coverUrl: item.cover_xl ?? item.cover_big ?? null,
  }))
}

// Deezer may file the album under any credited artist ("Nmesh And t e l e p a t h"
// is Nmesh's on Deezer); one whose name stands inside a credit counts too
// ("Goblin" in "Claudio Simonetti's Goblin")
const artistScore = (candidate: string, credits: string[]): number => {
  const candidateTokens = tokenize(candidate)
  return Math.max(
    ...credits.map((credit) => {
      const creditTokens = tokenize(credit)
      const isContained =
        candidateTokens.size > 0 &&
        [...candidateTokens].every((t) => creditTokens.has(t))
      return Math.max(
        similarity(candidate, credit),
        isContained ? ARTIST_THRESHOLD : 0,
      )
    }),
  )
}

const bestMatch = (
  candidates: Candidate[],
  credits: string[],
  title: string,
): string | null => {
  let best: { score: number; url: string } | null = null
  for (const c of candidates) {
    if (!c.coverUrl) continue
    const artist = artistScore(c.artistName, credits)
    const album = similarity(cleanTitle(c.albumTitle), title)
    if (artist < ARTIST_THRESHOLD || album < ALBUM_THRESHOLD) continue
    const score = artist + album
    if (!best || score > best.score) best = { score, url: c.coverUrl }
  }
  return best?.url ?? null
}

// Credits: every artist credited on the record, Lead credit first.
// Null only when Deezer answered and nothing matched
export const fetchDeezerCover = async (
  credits: string[],
  title: string,
): Promise<string | null> => {
  const lead = queryArtist(credits[0] ?? '')
  const t = cleanTitle(title)
  const tShort = stripSubtitle(t)

  const queries = [
    `artist:"${lead}" album:"${queryTitle(t)}"`,
    ...(tShort !== t ? [`artist:"${lead}" album:"${queryTitle(tShort)}"`] : []),
    // Deezer may know the record under another credited artist
    `album:"${queryTitle(t)}"`,
    `${lead} ${tShort}`,
  ]

  const signal = AbortSignal.timeout(LOOKUP_TIMEOUT_MS)
  for (const q of queries) {
    const candidates = await deezerSearch(q, signal)
    const match = bestMatch(candidates, credits, t)
    if (match) return match
  }

  return null
}
