import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'

import {
  RECORD_ROW_MEDIA_CLASSES,
  RecordRow,
} from '#/shared/components/RecordList'
import { cn } from '#/shared/utils/cn'
import { monogram } from '#/shared/utils/monogram'

import { artistDetailQueryOptions } from '../search.queries'
import type { Artist } from '../search.model'

interface ArtistCardProps {
  artist: Artist
  onClick: () => void
}

const stripDiscogsMarkup = (text: string): string =>
  text
    .replace(/\[a\d*=([^\]]+)\]/g, '$1')
    .replace(/\[url=[^\]]*\](.*?)\[\/url\]/g, '$1')
    .replace(/\[l=([^\]]+)\]/g, '$1')
    .replace(/\[r=([^\]]+)\]/g, '$1')
    .replace(/\[b\](.*?)\[\/b\]/g, '$1')
    .replace(/\[i\](.*?)\[\/i\]/g, '$1')
    .replace(/\[[\w/=\d ]+\]/g, '')
    .trim()

export const ArtistCard = ({ artist, onClick }: ArtistCardProps) => {
  const ref = useRef<HTMLLIElement>(null)
  const [isInView, setIsInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          observer.disconnect()
        }
      },
      { rootMargin: '200px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const { data: detail } = useQuery({
    ...artistDetailQueryOptions(String(artist.id)),
    enabled: isInView,
  })

  const profile = detail?.profile ? stripDiscogsMarkup(detail.profile) : null

  return (
    <li ref={ref}>
      <RecordRow
        onClick={onClick}
        media={
          artist.picture ? (
            <img
              src={artist.picture}
              alt=""
              className={cn(RECORD_ROW_MEDIA_CLASSES, 'object-cover')}
            />
          ) : (
            <span
              className={cn(
                RECORD_ROW_MEDIA_CLASSES,
                'type-display flex items-center justify-center bg-muted text-lg text-muted-foreground',
              )}
              aria-hidden
            >
              {monogram(artist.name)}
            </span>
          )
        }
        title={artist.name}
        description={profile}
      />
    </li>
  )
}
