import { coverArtQueryOptions } from '#/features/collection/collection.queries'
import { isCoverDecoded, preloadCover } from '#/shared/utils/cover-preload'
import type { CoverTintInput } from '#/shared/hooks/use-cover-tint'
import { useQuery } from '@tanstack/react-query'

// The Cover can show whole: its artwork decoded (CoverArt then shows it at
// once), or known to be missing, for its House sleeve
export const useCoverReady = ({
  coverKey,
  credits,
  title,
}: CoverTintInput): boolean => {
  // Same query CoverArt runs, so no extra request
  const { data: src, status } = useQuery(
    coverArtQueryOptions(coverKey, credits, title),
  )
  const { status: decodeStatus } = useQuery({
    queryKey: ['cover-decoded', src],
    queryFn: () => (src ? preloadCover(src) : false),
    enabled: !!src && !isCoverDecoded(src),
    staleTime: Infinity,
    retry: false,
  })

  if (status === 'pending') return false
  if (!src || isCoverDecoded(src)) return true
  return decodeStatus === 'success'
}
