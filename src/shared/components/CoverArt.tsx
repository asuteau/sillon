import { coverArtQueryOptions } from '#/features/collection/collection.queries'
import { HouseSleeve } from '#/shared/components/HouseSleeve'
import { useHdCover } from '#/shared/hooks/use-hd-cover'
import { useInView } from '#/shared/hooks/use-in-view'
import { coverState } from '#/shared/utils/cover-state'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

interface CoverArtProps {
  /** From masterCoverKey / releaseCoverKey */
  coverKey: string
  artist: string
  title: string
  thumb: string | null
  styles: string[]
  size?: number
  className?: string
}

export const CoverArt = ({
  coverKey,
  artist,
  title,
  thumb,
  size,
  className,
}: CoverArtProps) => {
  const { ref, isInView } = useInView()
  const [thumbLoaded, setThumbLoaded] = useState(false)
  const [thumbFailed, setThumbFailed] = useState(false)
  const { data: hdSrc, status: hdStatus } = useQuery({
    ...coverArtQueryOptions(coverKey, artist, title),
    enabled: isInView,
  })

  const { hdUrl, hdVisible, hdFailed } = useHdCover(hdSrc ?? null)

  const state = coverState({
    thumb,
    thumbFailed,
    hdSettled: hdStatus !== 'pending',
    hdSrc: hdSrc ?? null,
    hdFailed,
  })

  return (
    <div
      ref={ref}
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

      {thumb && !thumbFailed && (
        <img
          src={thumb}
          alt=""
          loading="lazy"
          crossOrigin="anonymous"
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-200 ${thumbLoaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setThumbLoaded(true)}
          onError={() => setThumbFailed(true)}
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
