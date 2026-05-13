import {
  cleanTitle,
  firstArtist,
  jaccardSimilarity,
  queryArtist,
  stripSubtitle,
  tokenize,
} from '#/services/deezer.utils'
import { z } from 'zod'

const ARTIST_THRESHOLD = 0.5
const ALBUM_THRESHOLD = 0.3

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

const deezerSearch = async (q: string): Promise<Candidate[]> => {
  const res = await fetch(
    `https://api.deezer.com/search/album?q=${encodeURIComponent(q)}&limit=5`,
    { headers: { 'User-Agent': 'Sillon/1.0' } },
  )
  if (!res.ok) return []
  const json = DeezerSearchSchema.parse(await res.json())
  return json.data.map((item) => ({
    artistName: item.artist?.name ?? '',
    albumTitle: item.title ?? '',
    coverUrl: item.cover_xl ?? item.cover_big ?? null,
  }))
}

const bestMatch = (
  candidates: Candidate[],
  artist: string,
  title: string,
): string | null => {
  let best: { score: number; url: string } | null = null
  for (const c of candidates) {
    if (!c.coverUrl) continue
    const artistScore = jaccardSimilarity(c.artistName, artist)
    const albumScore = jaccardSimilarity(cleanTitle(c.albumTitle), title)
    const artistTokens = tokenize(artist)
    const candidateArtistTokens = tokenize(c.artistName)
    const isContained =
      candidateArtistTokens.size > 0 &&
      [...candidateArtistTokens].every((t) => artistTokens.has(t))
    const effectiveArtistScore = isContained ? ARTIST_THRESHOLD : artistScore
    if (effectiveArtistScore < ARTIST_THRESHOLD || albumScore < ALBUM_THRESHOLD)
      continue
    const score = effectiveArtistScore + albumScore
    if (!best || score > best.score) best = { score, url: c.coverUrl }
  }
  return best?.url ?? null
}

export const fetchDeezerCover = async (
  artist: string,
  title: string,
): Promise<string | null> => {
  try {
    const qa = queryArtist(artist)
    const a = firstArtist(artist)
    const t = cleanTitle(title)
    const tShort = stripSubtitle(t)

    const queries = [
      `artist:"${qa}" album:"${t}"`,
      ...(tShort !== t ? [`artist:"${qa}" album:"${tShort}"`] : []),
      `${qa} ${tShort}`,
    ]

    for (const q of queries) {
      const candidates = await deezerSearch(q)
      const match = bestMatch(candidates, a, t)
      if (match) return match
    }

    return null
  } catch {
    return null
  }
}
