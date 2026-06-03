import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Mic2 } from 'lucide-react'

import { artistDetailQueryOptions } from '../search.queries'
import type { Artist } from '../search.model'

interface ArtistCardProps {
  artist: Artist
  onClick: () => void
  index: number
}

function stripDiscogsMarkup(text: string): string {
  return text
    .replace(/\[a\d*=([^\]]+)\]/g, '$1')
    .replace(/\[url=[^\]]*\](.*?)\[\/url\]/g, '$1')
    .replace(/\[l=([^\]]+)\]/g, '$1')
    .replace(/\[r=([^\]]+)\]/g, '$1')
    .replace(/\[b\](.*?)\[\/b\]/g, '$1')
    .replace(/\[i\](.*?)\[\/i\]/g, '$1')
    .replace(/\[[\w/=\d ]+\]/g, '')
    .trim()
}

export function ArtistCard({ artist, onClick, index }: ArtistCardProps) {
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
      <button
        onClick={onClick}
        className="island-shell feature-card rise-in flex w-full items-center gap-4 rounded-2xl px-4 py-3 cursor-pointer text-left"
        style={{ animationDelay: `${index * 60}ms` }}
      >
        {artist.thumb ? (
          <img
            src={artist.thumb}
            alt={artist.name}
            className="h-12 w-12 rounded-lg shrink-0 overflow-hidden object-cover"
          />
        ) : (
          <div className="h-12 w-12 rounded-lg shrink-0 bg-(--sand) flex items-center justify-center">
            <Mic2 className="h-5 w-5 text-(--sea-ink-soft) opacity-60" strokeWidth={1.25} />
          </div>
        )}
        <div className="flex flex-1 flex-col gap-0.5 min-w-0">
          <span className="font-semibold text-(--sea-ink) truncate">
            {artist.name}
          </span>
          {profile && (
            <span className="text-xs text-(--sea-ink-soft) line-clamp-1">
              {profile}
            </span>
          )}
        </div>
      </button>
    </li>
  )
}
