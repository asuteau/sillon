import { z } from 'zod'
import { cleanArtist, cleanTitle } from '#/services/deezer.utils'

const DeezerSearchSchema = z.object({
  data: z.array(
    z.object({
      album: z.object({
        cover_xl: z.string().optional(),
        cover_big: z.string().optional(),
      }),
    }),
  ),
})

const deezerSearch = async (q: string): Promise<string | null> => {
  const res = await fetch(
    `https://api.deezer.com/search?q=${encodeURIComponent(q)}`,
    { headers: { 'User-Agent': 'Sillon/1.0' } },
  )
  if (!res.ok) return null
  const json = DeezerSearchSchema.parse(await res.json())
  const first = json.data.at(0)
  if (!first) return null
  return first.album.cover_xl ?? first.album.cover_big ?? null
}

export const fetchDeezerCover = async (
  artist: string,
  title: string,
): Promise<string | null> => {
  try {
    const a = cleanArtist(artist)
    const t = cleanTitle(title)

    // Precise field search first
    const precise = await deezerSearch(`artist:"${a}" album:"${t}"`)
    if (precise) return precise

    // Fallback: free-text with cleaned inputs
    return await deezerSearch(`${a} ${t}`)
  } catch {
    return null
  }
}
