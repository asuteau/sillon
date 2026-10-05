import { useQueries, useQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { ScanLine, Search as SearchIcon } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { z } from 'zod'

import { BarcodeScanner } from '#/shared/components/BarcodeScanner'
import { SearchReleaseSheet } from '#/shared/components/SearchReleaseSheet'
import { useDebounce } from '#/shared/hooks/use-debounce'

import { ArtistCard } from '#/features/search/components/ArtistCard'
import { DiscographyCard } from '#/features/search/components/DiscographyCard'
import { MasterCard } from '#/features/search/components/MasterCard'
import { VersionRow } from '#/features/search/components/VersionRow'
import type { ArtistDiscographyItem } from '#/features/search/search.model'
import {
  toArtist,
  toArtistDiscographyItem,
  toMaster,
  toMasterVersion,
} from '#/features/search/search.model'
import {
  artistDetailQueryOptions,
  artistMastersQueryOptions,
  artistsQueryOptions,
  mastersQueryOptions,
  versionsQueryOptions,
} from '#/features/search/search.queries'
import type {
  ArtistMasters,
  DiscographyFormat,
} from '#/features/search/search.schema'
import {
  isCompilation,
  isCreditedTo,
  isEp,
  isStudioAlbum,
} from '#/features/search/search.utils'

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
          <ModeToggle mode={mode} onModeChange={handleModeChange} />

          <div className="relative mb-6">
            <input
              ref={inputRef}
              type="search"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Artist, album, label..."
              className="island-shell w-full rounded-2xl px-4 py-3 pr-10 text-(--sea-ink) placeholder:text-(--sea-ink-soft) outline-none"
            />
            <button
              onClick={() => setIsScannerOpen(true)}
              className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-(--sea-ink-soft) transition-colors hover:text-(--sea-ink)"
              aria-label="Scan barcode"
            >
              <ScanLine className="h-4 w-4" />
            </button>
          </div>
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
        <SearchIcon className="h-12 w-12 text-(--sea-ink)" />
        <div>
          <p className="font-semibold text-(--sea-ink)">Find a record</p>
          <p className="mt-1 text-sm text-(--sea-ink-soft)">
            Search Discogs to find a record to add.
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

type ClassifiedFilter = 'albums' | 'eps' | 'compilations'
type DiscographyFilter = ClassifiedFilter | 'all'

// Each classified filter is its own Discogs search, so the full Discography only loads on demand
const CLASSIFIED_FILTERS = {
  albums: {
    label: 'Studio albums',
    format: 'Album',
    matches: (i) => isStudioAlbum(i.title, i.formats),
  },
  eps: { label: 'EPs', format: 'EP', matches: (i) => isEp(i.formats) },
  compilations: {
    label: 'Compilations',
    format: 'Compilation',
    matches: (i) => isCompilation(i.formats),
  },
} satisfies Record<
  ClassifiedFilter,
  {
    label: string
    format: DiscographyFormat
    matches: (item: ArtistDiscographyItem) => boolean
  }
>

// Default order when the chosen filter is empty, the slow full Discography last
const FALLBACK_ORDER: ClassifiedFilter[] = ['albums', 'eps', 'compilations']

const FILTER_CHIPS: { key: DiscographyFilter; label: string }[] = [
  ...FALLBACK_ORDER.map((key) => ({
    key,
    label: CLASSIFIED_FILTERS[key].label,
  })),
  { key: 'all', label: 'All' },
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

  // Name variations tell the artist's own credits from homonyms'
  const { data: artist, isPending: isArtistPending } = useQuery(
    artistDetailQueryOptions(artistId),
  )
  const [albumsQuery, epsQuery, compilationsQuery] = useQueries({
    queries: FALLBACK_ORDER.map((key) =>
      artistMastersQueryOptions(artistName, CLASSIFIED_FILTERS[key].format),
    ),
  })
  const isClassifiedPending =
    isArtistPending ||
    albumsQuery.isPending ||
    epsQuery.isPending ||
    compilationsQuery.isPending

  const names = useMemo(
    () =>
      artist ? [artist.name, ...(artist.namevariations ?? [])] : [artistName],
    [artist, artistName],
  )

  const classifiedItems = useMemo(() => {
    const keep = (data: ArtistMasters | undefined, key: ClassifiedFilter) =>
      (data?.results ?? [])
        .map(toArtistDiscographyItem)
        .filter(
          (item) =>
            isCreditedTo(item.credit, names) &&
            CLASSIFIED_FILTERS[key].matches(item),
        )
    return {
      albums: keep(albumsQuery.data, 'albums'),
      eps: keep(epsQuery.data, 'eps'),
      compilations: keep(compilationsQuery.data, 'compilations'),
    } satisfies Record<ClassifiedFilter, ArtistDiscographyItem[]>
  }, [names, albumsQuery.data, epsQuery.data, compilationsQuery.data])

  // Artists without studio albums (singles-only DJs…) fall back to the first non-empty filter
  const activeFilter: DiscographyFilter =
    filter === 'albums' && classifiedItems.albums.length === 0
      ? (FALLBACK_ORDER.find((key) => classifiedItems[key].length > 0) ?? 'all')
      : filter

  const allQuery = useQuery(
    artistMastersQueryOptions(
      artistName,
      null,
      !isClassifiedPending && activeFilter === 'all',
    ),
  )
  const allItems = useMemo(
    () =>
      (allQuery.data?.results ?? [])
        .map(toArtistDiscographyItem)
        .filter((item) => isCreditedTo(item.credit, names)),
    [allQuery.data, names],
  )

  if (isClassifiedPending) {
    return <p className="text-(--sea-ink-soft)">Loading discography…</p>
  }

  const items =
    activeFilter === 'all' ? allItems : classifiedItems[activeFilter]
  const activeQuery = {
    albums: albumsQuery,
    eps: epsQuery,
    compilations: compilationsQuery,
    all: allQuery,
  }[activeFilter]

  return (
    <>
      <div className="mb-6 flex gap-2 flex-wrap">
        {FILTER_CHIPS.map(({ key, label }) => {
          const count = key === 'all' ? null : classifiedItems[key].length
          if (count === 0) return null
          return (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`cursor-pointer whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                activeFilter === key
                  ? 'bg-(--sea-ink) text-(--chip-bg)'
                  : 'border border-(--line) text-(--sea-ink)'
              }`}
            >
              {label}
              {count !== null && (
                <span className="ml-1 opacity-50">{count}</span>
              )}
            </button>
          )
        })}
      </div>

      {activeQuery.isPending ? (
        <p className="text-(--sea-ink-soft)">Loading discography…</p>
      ) : items.length === 0 ? (
        <p className="text-(--sea-ink-soft)">No releases found.</p>
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

      {activeQuery.data?.truncated && (
        <p className="mt-6 text-center text-sm text-(--sea-ink-soft)">
          Older releases not shown — search by title
        </p>
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
        <SearchIcon className="h-12 w-12 text-(--sea-ink)" />
        <div>
          <p className="font-semibold text-(--sea-ink)">Find a record</p>
          <p className="mt-1 text-sm text-(--sea-ink-soft)">
            Search Discogs to find a record to add.
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
