import {
  coverArtQueryOptions,
  coverTintQueryOptions,
} from '#/features/collection/collection.queries'
import { useQuery } from '@tanstack/react-query'

export interface CoverTintInput {
  coverKey: string
  artist: string
  title: string
}

// The Cover's dominant, muted colour as a CSS colour, or null (neutral) while
// it loads, when it can't be sampled, and for House sleeves.
// Samples the Deezer Cover only: Discogs images send no CORS headers, so a
// canvas can't read them. Records without a Deezer match stay neutral.
export const useCoverTint = ({
  coverKey,
  artist,
  title,
}: CoverTintInput): string | null => {
  // Same query CoverArt runs, so no extra request
  const { data: hdSrc } = useQuery(
    coverArtQueryOptions(coverKey, artist, title),
  )
  const { data } = useQuery(coverTintQueryOptions(coverKey, hdSrc ?? null))
  return data ?? null
}
