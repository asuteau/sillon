import {
  coverArtQueryOptions,
  coverTintQueryOptions,
} from '#/features/collection/collection.queries'
import { useQuery } from '@tanstack/react-query'

export interface CoverTintInput {
  coverKey: string
  artist: string
  title: string
  thumb: string | null
}

// The Cover's dominant, muted colour as a CSS colour, or null (neutral) while
// it loads, when it can't be sampled, and for House sleeves
export const useCoverTint = ({
  coverKey,
  artist,
  title,
  thumb,
}: CoverTintInput): string | null => {
  // Same query CoverArt runs, so no extra request
  const { data: hdSrc } = useQuery({
    ...coverArtQueryOptions(coverKey, artist, title),
    enabled: !thumb,
  })
  const src = thumb || hdSrc || null
  const { data } = useQuery(coverTintQueryOptions(coverKey, src))
  return data ?? null
}
