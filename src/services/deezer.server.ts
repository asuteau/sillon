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
// Per request, once it leaves the queue: past it the lookup fails like any
// Deezer error, so it isn't remembered and the record shows a House sleeve
const REQUEST_TIMEOUT_MS = 5000
// Deezer allows 50 requests per 5 seconds, then answers "Quota limit exceeded"
const QUOTA_WINDOW_MS = 5000
const QUOTA_REQUESTS = 45
const QUOTA_RETRIES = 2

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

const DeezerErrorSchema = z.object({ error: z.object({ code: z.number() }) })
const QUOTA_EXCEEDED = 4

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// A whole list looks its Covers up at once: requests queue for a slot in the
// quota rather than fail
const sentAt: number[] = []
const takeQuotaSlot = async (): Promise<void> => {
  for (;;) {
    const now = Date.now()
    while (sentAt.length && now - sentAt[0] >= QUOTA_WINDOW_MS) sentAt.shift()
    if (sentAt.length < QUOTA_REQUESTS) {
      sentAt.push(now)
      return
    }
    await sleep(sentAt[0] + QUOTA_WINDOW_MS - now)
  }
}

type Candidate = {
  artistName: string
  albumTitle: string
  coverUrl: string | null
}

const deezerSearch = async (
  q: string,
  retries = QUOTA_RETRIES,
): Promise<Candidate[]> => {
  await takeQuotaSlot()
  const res = await fetch(
    `https://api.deezer.com/search/album?q=${encodeURIComponent(q)}&limit=${RESULTS_PER_QUERY}`,
    {
      headers: { 'User-Agent': 'Sillon/1.0' },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    },
  )
  // Throws on failure (network, quota, bad payload) so it's never mistaken
  // for "no match", which callers remember
  if (!res.ok) throw new Error(`Deezer search failed: ${res.status}`)
  const body: unknown = await res.json()
  const error = DeezerErrorSchema.safeParse(body)
  if (error.success) {
    // Another server instance, or another app on this IP, spent the quota
    if (error.data.error.code === QUOTA_EXCEEDED && retries > 0) {
      await sleep(QUOTA_WINDOW_MS)
      return deezerSearch(q, retries - 1)
    }
    throw new Error(`Deezer search failed: error ${error.data.error.code}`)
  }
  const json = DeezerSearchSchema.parse(body)
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
    // Field search misses some artists outright ("Korn")
    `${lead} ${tShort}`,
    // Deezer may know the record under another credited artist
    `album:"${queryTitle(t)}"`,
  ]

  for (const q of queries) {
    const candidates = await deezerSearch(q)
    const match = bestMatch(candidates, credits, t)
    if (match) return match
  }

  return null
}
