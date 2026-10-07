import { coverArtQueryOptions } from '#/features/collection/collection.queries'
import { useInView } from '#/shared/hooks/use-in-view'
import { useQuery } from '@tanstack/react-query'
import { Disc3 } from 'lucide-react'
import { useEffect, useState } from 'react'

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

export function CoverArt({
  coverKey,
  artist,
  title,
  thumb,
  size,
  className,
}: CoverArtProps) {
  const { ref, isInView } = useInView()
  const [thumbLoaded, setThumbLoaded] = useState(false)
  const [hdUrl, setHdUrl] = useState<string | null>(null)
  const [hdVisible, setHdVisible] = useState(false)

  const { data: hdSrc } = useQuery({
    ...coverArtQueryOptions(coverKey, artist, title),
    enabled: isInView,
  })

  useEffect(() => {
    if (!hdSrc) return
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      setHdUrl(hdSrc)
      requestAnimationFrame(() =>
        requestAnimationFrame(() => setHdVisible(true)),
      )
    }
    img.src = hdSrc
  }, [hdSrc])

  return (
    <div
      ref={ref}
      className={`relative ${className ?? ''}`}
      style={size ? { width: size, height: size } : undefined}
    >
      <div className="absolute inset-0 bg-(--sand)" />

      {thumb && (
        <img
          src={thumb}
          alt=""
          loading="lazy"
          crossOrigin="anonymous"
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-200 ${thumbLoaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setThumbLoaded(true)}
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

      {!hdVisible && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Disc3
            style={{ width: '42%', height: '42%', strokeWidth: 0.75 }}
            className="text-(--sea-ink-soft) opacity-60"
          />
        </div>
      )}
    </div>
  )
}
