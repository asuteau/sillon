import { useQuery } from '@tanstack/react-query'
import { PlusCircle, ScanLine } from 'lucide-react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useMemo, useRef, useState } from 'react'
import { z } from 'zod'

import { BarcodeScanner } from '#/shared/components/BarcodeScanner'
import { SearchReleaseSheet } from '#/shared/components/SearchReleaseSheet'
import { useDebounce } from '#/shared/hooks/use-debounce'

import { ArtistCard } from '#/features/search/components/ArtistCard'
import { DiscographyCard } from '#/features/search/components/DiscographyCard'
import { MasterCard } from '#/features/search/components/MasterCard'
import { VersionRow } from '#/features/search/components/VersionRow'
import {
  toArtist,
  toArtistDiscographyItem,
  toMaster,
  toMasterVersion,
} from '#/features/search/search.model'
import {
  artistReleasesQueryOptions,
  artistsQueryOptions,
  mastersQueryOptions,
  versionsQueryOptions,
} from '#/features/search/search.queries'

export const Route = createFileRoute('/_authenticated/search')({
  validateSearch: z.object({
    q: z.string().default(''),
    mode: z.enum(['artist', 'title']).default('artist'),
    artistId: z.string().optional(),
    artistName: z.string().optional(),
    masterId: z.string().optional(),
    releaseId: z.string().optional(),
  }),
  component: Search,
})

function Search() {
  const { q, mode, artistId, artistName, masterId, releaseId } =
    Route.useSearch()
  const navigate = useNavigate({ from: '/search' })
  const [inputValue, setInputValue] = useState(q)
  const [isScannerOpen, setIsScannerOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const debouncedValue = useDebounce(inputValue)

  useEffect(() => {
    if (debouncedValue === q) return
    navigate({
      search: (s) => ({
        ...s,
        q: debouncedValue,
        artistId: undefined,
        masterId: undefined,
        releaseId: undefined,
      }),
    }).catch(() => {})
  }, [debouncedValue])

  const handleModeChange = (newMode: 'artist' | 'title') => {
    navigate({
      search: { q, mode: newMode },
    }).catch(() => {})
  }

  const handleArtistClick = (id: number, name: string) => {
    navigate({
      search: (s) => ({ ...s, artistId: String(id), artistName: name }),
    }).catch(() => {})
  }

  const handleMasterClick = (id: number) => {
    navigate({
      search: (s) => ({ ...s, masterId: String(id) }),
    }).catch(() => {})
  }

  const handleBackFromDiscography = () => {
    navigate({
      search: (s) => ({ q: s.q, mode: s.mode, artistName: undefined }),
    }).catch(() => {})
  }

  const handleBackFromVersions = () => {
    navigate({
      search: (s) => ({
        q: s.q,
        mode: s.mode,
        artistId: s.artistId,
      }),
    }).catch(() => {})
  }

  const handleCloseSheet = () => {
    navigate({
      search: (s) => ({ ...s, releaseId: undefined }),
    }).catch(() => {})
  }

  const showVersions = masterId !== undefined
  const showDiscography =
    !showVersions && mode === 'artist' && artistId !== undefined

  const backLabel = showVersions
    ? mode === 'artist' && artistId
      ? '← Albums'
      : '← Search'
    : showDiscography
      ? '← Search'
      : null

  const handleBack = showVersions
    ? handleBackFromVersions
    : handleBackFromDiscography

  return (
    <main className="page-wrap px-4 pb-24 sm:pb-8 pt-14">
      {backLabel ? (
        <div className="mb-6 flex items-center gap-4">
          <button
            onClick={handleBack}
            className="island-kicker rise-in inline-flex items-center gap-1.5 cursor-pointer"
          >
            {backLabel}
          </button>
        </div>
      ) : (
        <header className="mb-8">
          <h1 className="display-title text-4xl font-bold tracking-tight text-(--sea-ink)">
            Add a record
          </h1>
          <p className="mt-1 text-sm text-(--sea-ink-soft)">
            Search Discogs to add to your collection or wantlist
          </p>
        </header>
      )}

      {!showVersions && !showDiscography && (
        <>
          <div className="mb-6">
            <input
              ref={inputRef}
              type="search"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Artist, album, label..."
              className="island-shell w-full rounded-2xl px-4 py-3 text-(--sea-ink) placeholder:text-(--sea-ink-soft) outline-none"
            />
          </div>

          <div className="mb-6 flex justify-center">
            <button
              onClick={() => setIsScannerOpen(true)}
              className="flex items-center gap-1.5 text-sm text-(--sea-ink-soft) transition-colors hover:text-(--sea-ink) cursor-pointer"
            >
              <ScanLine className="h-4 w-4" />
              or scan a barcode
            </button>
          </div>

          <ModeToggle mode={mode} onModeChange={handleModeChange} />
        </>
      )}

      {showVersions ? (
        <VersionsList masterId={masterId} />
      ) : showDiscography ? (
        <DiscographyList
          artistId={artistId}
          artistName={artistName ?? q}
          onMasterClick={handleMasterClick}
        />
      ) : mode === 'artist' ? (
        <ArtistList q={q} onArtistClick={handleArtistClick} />
      ) : (
        <MastersList q={q} onMasterClick={handleMasterClick} />
      )}

      {releaseId && masterId && (
        <SearchReleaseSheet
          releaseId={releaseId}
          masterId={masterId}
          onClose={handleCloseSheet}
        />
      )}

      {isScannerOpen && (
        <BarcodeScanner
          onClose={() => setIsScannerOpen(false)}
          onSearchManually={() => {
            setIsScannerOpen(false)
            inputRef.current?.focus()
          }}
        />
      )}
    </main>
  )
}

interface ModeToggleProps {
  mode: 'artist' | 'title'
  onModeChange: (mode: 'artist' | 'title') => void
}

function ModeToggle({ mode, onModeChange }: ModeToggleProps) {
  return (
    <div className="mb-6 flex gap-2">
      {(['artist', 'title'] as const).map((m) => (
        <button
          key={m}
          onClick={() => onModeChange(m)}
          className={`cursor-pointer whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
            mode === m
              ? 'bg-(--sea-ink) text-(--chip-bg)'
              : 'border border-(--line) text-(--sea-ink)'
          }`}
        >
          {m === 'artist' ? 'By artist' : 'By title'}
        </button>
      ))}
    </div>
  )
}

interface ArtistListProps {
  q: string
  onArtistClick: (id: number, name: string) => void
}

function ArtistList({ q, onArtistClick }: ArtistListProps) {
  const { data, isFetching } = useQuery(artistsQueryOptions(q))

  const artists = useMemo(
    () => (data?.results ?? []).map(toArtist),
    [data?.results],
  )

  if (q.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <PlusCircle className="h-12 w-12 text-(--sea-ink)" />
        <div>
          <p className="font-semibold text-(--sea-ink)">Find a record</p>
          <p className="mt-1 text-sm text-(--sea-ink-soft)">
            Search by artist to browse their full discography,
            <br />
            or switch to "By title" to search album names directly.
          </p>
        </div>
      </div>
    )
  }

  if (q.length <= 2) {
    return (
      <p className="text-(--sea-ink-soft)">
        Type at least 3 characters to search.
      </p>
    )
  }

  if (isFetching && artists.length === 0) {
    return <p className="text-(--sea-ink-soft)">Searching…</p>
  }

  if (artists.length === 0) {
    return <p className="text-(--sea-ink-soft)">No artists found for "{q}".</p>
  }

  return (
    <ul className="flex flex-col gap-3">
      {artists.map((artist, index) => (
        <ArtistCard
          key={artist.id}
          artist={artist}
          index={index}
          onClick={() => onArtistClick(artist.id, artist.name)}
        />
      ))}
    </ul>
  )
}

type DiscographyFilter = 'albums' | 'eps' | 'compilations' | 'all'

const DISCOGRAPHY_FILTERS: {
  key: DiscographyFilter
  label: string
  match: string
}[] = [
  { key: 'albums', label: 'Albums', match: 'Album' },
  { key: 'eps', label: 'EPs', match: 'EP' },
  { key: 'compilations', label: 'Compilations', match: 'Compilation' },
  { key: 'all', label: 'All', match: '' },
]

interface DiscographyListProps {
  artistId: string
  artistName: string
  onMasterClick: (id: number) => void
}

function DiscographyList({
  artistId,
  artistName,
  onMasterClick,
}: DiscographyListProps) {
  const [filter, setFilter] = useState<DiscographyFilter>('albums')

  // Primary: artist-ID based — complete, no false positives
  const { data: releasesData, isFetching } = useQuery(
    artistReleasesQueryOptions(artistId),
  )
  // Format enrichment: search API joined by master ID
  const { data: searchData } = useQuery(
    mastersQueryOptions(artistName, 'artist'),
  )

  const allItems = useMemo(() => {
    const formatMap = new Map<number, string[]>()
    for (const raw of searchData?.results ?? []) {
      if (raw.format?.length) formatMap.set(raw.id, raw.format)
    }
    return (releasesData?.releases ?? [])
      .map(toArtistDiscographyItem)
      .map((item) => ({ ...item, formats: formatMap.get(item.id) ?? [] }))
  }, [releasesData?.releases, searchData?.results])

  const counts = useMemo(
    () => ({
      albums: allItems.filter(
        (i) => i.formats.includes('Album') || i.formats.length === 0,
      ).length,
      eps: allItems.filter((i) => i.formats.includes('EP')).length,
      compilations: allItems.filter((i) => i.formats.includes('Compilation'))
        .length,
      all: allItems.length,
    }),
    [allItems],
  )

  const showAllChip = counts.eps > 0 || counts.compilations > 0

  const items = useMemo(() => {
    if (filter === 'all') return allItems
    if (filter === 'albums')
      return allItems.filter(
        (i) => i.formats.includes('Album') || i.formats.length === 0,
      )
    const match = DISCOGRAPHY_FILTERS.find(
      (entry) => entry.key === filter,
    )!.match
    return allItems.filter((i) => i.formats.includes(match))
  }, [allItems, filter])

  if (isFetching && allItems.length === 0) {
    return <p className="text-(--sea-ink-soft)">Loading discography…</p>
  }

  return (
    <>
      <div className="mb-6 flex gap-2 flex-wrap">
        {DISCOGRAPHY_FILTERS.map(({ key, label }) => {
          const count = counts[key]
          if (key === 'all' && !showAllChip) return null
          if (key !== 'all' && count === 0) return null
          return (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`cursor-pointer whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                filter === key
                  ? 'bg-(--sea-ink) text-(--chip-bg)'
                  : 'border border-(--line) text-(--sea-ink)'
              }`}
            >
              {label}
              {key !== 'all' && (
                <span className="ml-1 opacity-50">{count}</span>
              )}
            </button>
          )
        })}
      </div>

      {items.length === 0 ? (
        <p className="text-(--sea-ink-soft)">No {filter} found.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((item, index) => (
            <DiscographyCard
              key={item.id}
              item={item}
              artistName={artistName}
              index={index}
              onClick={() => onMasterClick(item.id)}
            />
          ))}
        </ul>
      )}
    </>
  )
}

interface MastersListProps {
  q: string
  onMasterClick: (id: number) => void
}

function MastersList({ q, onMasterClick }: MastersListProps) {
  const { data, isFetching } = useQuery(mastersQueryOptions(q))

  const masters = useMemo(
    () => (data?.results ?? []).map(toMaster),
    [data?.results],
  )

  if (q.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <PlusCircle className="h-12 w-12 text-(--sea-ink)" />
        <div>
          <p className="font-semibold text-(--sea-ink)">Find a record</p>
          <p className="mt-1 text-sm text-(--sea-ink-soft)">
            Search by album title, label, or artist name.
          </p>
        </div>
      </div>
    )
  }

  if (q.length <= 2) {
    return (
      <p className="text-(--sea-ink-soft)">
        Type at least 3 characters to search.
      </p>
    )
  }

  if (isFetching && masters.length === 0) {
    return <p className="text-(--sea-ink-soft)">Searching…</p>
  }

  if (masters.length === 0) {
    return <p className="text-(--sea-ink-soft)">No results for "{q}".</p>
  }

  return (
    <ul className="flex flex-col gap-3">
      {masters.map((master, index) => (
        <MasterCard
          key={master.id}
          master={master}
          index={index}
          onClick={() => onMasterClick(master.id)}
        />
      ))}
    </ul>
  )
}

interface VersionsListProps {
  masterId: string
}

function VersionsList({ masterId }: VersionsListProps) {
  const { data, isFetching } = useQuery(versionsQueryOptions(masterId))

  const versions = useMemo(
    () => (data?.versions ?? []).map(toMasterVersion),
    [data?.versions],
  )

  if (isFetching && versions.length === 0) {
    return <p className="text-(--sea-ink-soft)">Loading versions…</p>
  }

  if (versions.length === 0) {
    return <p className="text-(--sea-ink-soft)">No vinyl versions found.</p>
  }

  return (
    <ul className="flex flex-col gap-3">
      {versions.map((version) => (
        <VersionRow key={version.id} version={version} masterId={masterId} />
      ))}
    </ul>
  )
}
