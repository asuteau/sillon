import { useQueries, useQuery } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { ScanIcon } from '#/shared/components/icons/ScanIcon'
import { SearchIcon } from '#/shared/components/icons/SearchIcon'
import { useEffect, useMemo, useRef, useState } from 'react'
import { z } from 'zod'

import { BarcodeScanner } from '#/shared/components/BarcodeScanner'
import { RecordList } from '#/shared/components/RecordList'
import { Button } from '#/shared/components/ui/button'
import { Chip } from '#/shared/components/ui/chip'
import { Input } from '#/shared/components/ui/input'
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
  isEp,
  isStudioAlbum,
} from '#/features/search/search.utils'
import { Page } from '#/shared/components/Page'

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
      ? 'Albums'
      : 'Search'
    : showDiscography
      ? 'Search'
      : null

  const handleBack = showVersions
    ? handleBackFromVersions
    : handleBackFromDiscography

  return (
    <Page className="pb-24">
      {backLabel ? (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBack}
          className="mb-6 -ml-2"
        >
          <ArrowLeft />
          {backLabel}
        </Button>
      ) : (
        <header className="mb-6">
          <h1 className="type-display text-4xl text-foreground">
            Add a record
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Search Discogs to add to your collection or wantlist.
          </p>
        </header>
      )}

      {!showVersions && !showDiscography && (
        <>
          <ModeToggle mode={mode} onModeChange={handleModeChange} />

          <div className="relative mb-6">
            <Input
              ref={inputRef}
              type="search"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Artist, album, label..."
              className="h-12 pr-12"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsScannerOpen(true)}
              className="absolute top-1/2 right-2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Scan barcode"
            >
              <ScanIcon />
            </Button>
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
    </Page>
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
        <Chip key={m} active={mode === m} onClick={() => onModeChange(m)}>
          {m === 'artist' ? 'By artist' : 'By title'}
        </Chip>
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
        <SearchIcon className="size-12 text-foreground" />
        <div>
          <p className="type-title text-lg text-foreground">Find a record</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Search Discogs to find a record to add.
          </p>
        </div>
      </div>
    )
  }

  if (q.length <= 2) {
    return (
      <p className="text-muted-foreground">
        Type at least 3 characters to search.
      </p>
    )
  }

  if (isFetching && artists.length === 0) {
    return <p className="text-muted-foreground">Searching…</p>
  }

  if (artists.length === 0) {
    return <p className="text-muted-foreground">No artists found for "{q}".</p>
  }

  return (
    <RecordList>
      {artists.map((artist) => (
        <ArtistCard
          key={artist.id}
          artist={artist}
          onClick={() => onArtistClick(artist.id, artist.name)}
        />
      ))}
    </RecordList>
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

  // Its ID and Name variations tell the artist's own credits from homonyms'
  const { data: artistDetail, isPending: isArtistPending } = useQuery(
    artistDetailQueryOptions(artistId),
  )
  const artist = useMemo(
    () =>
      artistDetail && {
        id: artistDetail.id,
        name: artistDetail.name,
        variations: artistDetail.namevariations ?? [],
      },
    [artistDetail],
  )
  const [albumsQuery, epsQuery, compilationsQuery] = useQueries({
    queries: FALLBACK_ORDER.map((key) =>
      artistMastersQueryOptions(artist, CLASSIFIED_FILTERS[key].format),
    ),
  })
  const isClassifiedPending =
    isArtistPending ||
    albumsQuery.isPending ||
    epsQuery.isPending ||
    compilationsQuery.isPending

  const classifiedItems = useMemo(() => {
    const keep = (data: ArtistMasters | undefined, key: ClassifiedFilter) =>
      (data?.results ?? [])
        .map(toArtistDiscographyItem)
        .filter(CLASSIFIED_FILTERS[key].matches)
    return {
      albums: keep(albumsQuery.data, 'albums'),
      eps: keep(epsQuery.data, 'eps'),
      compilations: keep(compilationsQuery.data, 'compilations'),
    } satisfies Record<ClassifiedFilter, ArtistDiscographyItem[]>
  }, [albumsQuery.data, epsQuery.data, compilationsQuery.data])

  // Artists without studio albums (singles-only DJs…) fall back to the first non-empty filter
  const activeFilter: DiscographyFilter =
    filter === 'albums' && classifiedItems.albums.length === 0
      ? (FALLBACK_ORDER.find((key) => classifiedItems[key].length > 0) ?? 'all')
      : filter

  const allQuery = useQuery(
    artistMastersQueryOptions(
      artist,
      null,
      !isClassifiedPending && activeFilter === 'all',
    ),
  )
  const allItems = useMemo(
    () => (allQuery.data?.results ?? []).map(toArtistDiscographyItem),
    [allQuery.data],
  )

  if (isClassifiedPending) {
    return <p className="text-muted-foreground">Loading discography…</p>
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
      <div className="mb-6 flex flex-wrap gap-2">
        {FILTER_CHIPS.map(({ key, label }) => {
          const count = key === 'all' ? null : classifiedItems[key].length
          if (count === 0) return null
          return (
            <Chip
              key={key}
              active={activeFilter === key}
              onClick={() => setFilter(key)}
            >
              {label}
              {count !== null && (
                <span className="type-catalogue text-[11px] opacity-60">
                  {count}
                </span>
              )}
            </Chip>
          )
        })}
      </div>

      {activeQuery.isPending ? (
        <p className="text-muted-foreground">Loading discography…</p>
      ) : items.length === 0 ? (
        <p className="text-muted-foreground">No releases found.</p>
      ) : (
        <RecordList>
          {items.map((item) => (
            <DiscographyCard
              key={item.id}
              item={item}
              artistName={artistName}
              onClick={() => onMasterClick(item.id)}
            />
          ))}
        </RecordList>
      )}

      {activeQuery.data?.truncated && (
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Older releases not shown. Search by title to find them.
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
        <SearchIcon className="size-12 text-foreground" />
        <div>
          <p className="type-title text-lg text-foreground">Find a record</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Search Discogs to find a record to add.
          </p>
        </div>
      </div>
    )
  }

  if (q.length <= 2) {
    return (
      <p className="text-muted-foreground">
        Type at least 3 characters to search.
      </p>
    )
  }

  if (isFetching && masters.length === 0) {
    return <p className="text-muted-foreground">Searching…</p>
  }

  if (masters.length === 0) {
    return <p className="text-muted-foreground">No results for "{q}".</p>
  }

  return (
    <RecordList>
      {masters.map((master) => (
        <MasterCard
          key={master.id}
          master={master}
          onClick={() => onMasterClick(master.id)}
        />
      ))}
    </RecordList>
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
    return <p className="text-muted-foreground">Loading versions…</p>
  }

  if (versions.length === 0) {
    return <p className="text-muted-foreground">No vinyl versions found.</p>
  }

  return (
    <RecordList>
      {versions.map((version) => (
        <VersionRow key={version.id} version={version} masterId={masterId} />
      ))}
    </RecordList>
  )
}
