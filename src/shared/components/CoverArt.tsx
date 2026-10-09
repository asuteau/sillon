import { coverArtQueryOptions } from '#/features/collection/collection.queries'
import { HouseSleeve } from '#/shared/components/HouseSleeve'
import { useHdCover } from '#/shared/hooks/use-hd-cover'
import { useInView } from '#/shared/hooks/use-in-view'
import { coverState } from '#/shared/utils/cover-state'
import { useQuery } from '@tanstack/react-query'
import { useCallback } from 'react'

interface CoverArtProps {
  /** From masterCoverKey / releaseCoverKey */
  coverKey: string
  /** Typeset on the House sleeve */
  artist: string
  /** Every artist credited on the record, Lead credit first, to look the Cover up by */
  credits: string[]
  title: string
  styles: string[]
  size?: number
  className?: string
  // The Cover box, e.g. for the cover → detail transition. Keep it stable.
  ref?: React.Ref<HTMLDivElement>
}

// Deezer only: Discogs images are never shown (see CONTEXT.md → Cover)
export const CoverArt = ({
  coverKey,
  artist,
  credits,
  title,
  size,
  className,
  ref,
}: CoverArtProps) => {
  const { ref: inViewRef, isInView } = useInView()
  const coverRef = useCallback(
    (node: HTMLDivElement | null) => {
      inViewRef.current = node
      if (typeof ref === 'function') return ref(node)
      if (ref) ref.current = node
    },
    [inViewRef, ref],
  )
  const { data: hdSrc, status: hdStatus } = useQuery({
    ...coverArtQueryOptions(coverKey, credits, title),
    enabled: isInView,
  })

  const { hdUrl, hdVisible, hdFailed } = useHdCover(hdSrc ?? null)

  const state = coverState({
    hdSettled: hdStatus !== 'pending',
    hdSrc: hdSrc ?? null,
    hdFailed,
  })

  return (
    <div
      ref={coverRef}
      data-slot="cover"
      className={`relative ${className ?? ''}`}
      style={size ? { width: size, height: size } : undefined}
    >
      <div className="absolute inset-0 bg-muted" />

      {state === 'house' && (
        <HouseSleeve
          artist={artist}
          title={title}
          coverKey={coverKey}
          className="absolute inset-0 size-full"
        />
      )}

      {hdUrl && (
        <img
          src={hdUrl}
          alt=""
          crossOrigin="anonymous"
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${hdVisible ? 'opacity-100' : 'opacity-0'}`}
        />
      )}
    </div>
  )
}
