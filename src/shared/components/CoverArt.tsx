import { coverArtQueryOptions } from '#/features/collection/collection.queries'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'

// TODO: replace static map with dominant color extracted from the cover image via Canvas API
const GENRE_COLORS: Record<string, string> = {
  Electronic: '#1a2a3a',
  Ambient: '#1a2a3a',
  Jazz: '#2a1a0a',
  Rock: '#1a1a2a',
  Alternative: '#1a1a2a',
  Classical: '#2a2a1a',
  'Hip-Hop': '#0a1a0a',
}
const DEFAULT_COLOR = '#141414'

interface CoverArtProps {
  releaseId: string
  artist: string
  title: string
  thumb: string | null
  styles: string[]
  size?: number
  className?: string
}

export function CoverArt({
  releaseId,
  artist,
  title,
  thumb,
  styles,
  size,
  className,
}: CoverArtProps) {
  const [thumbLoaded, setThumbLoaded] = useState(false)
  const [hdUrl, setHdUrl] = useState<string | null>(null)
  const [hdVisible, setHdVisible] = useState(false)

  const colorBg = GENRE_COLORS[styles[0] ?? ''] ?? DEFAULT_COLOR

  const { data: hdSrc } = useQuery(
    coverArtQueryOptions(releaseId, artist, title),
  )

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
      className={`relative ${className ?? ''}`}
      style={size ? { width: size, height: size } : undefined}
    >
      <div className="absolute inset-0" style={{ backgroundColor: colorBg }} />

      {thumb && (
        <img
          src={thumb}
          alt=""
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
    </div>
  )
}
