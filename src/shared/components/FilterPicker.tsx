import { SlidersHorizontal } from 'lucide-react'
import { useId, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

import { ReadingState } from '#/shared/components/ReadingState'
import { Button } from '#/shared/components/ui/button'
import { Chip } from '#/shared/components/ui/chip'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '#/shared/components/ui/drawer'
import { Input } from '#/shared/components/ui/input'
import { formatRecords } from '#/shared/utils/format-records'
import { listFacets, searchArtists } from '#/shared/utils/list-facets'
import type { FacetValue } from '#/shared/utils/list-facets'
import { filterRecords, pickFilters } from '#/shared/utils/list-filter'
import type {
  FilterableRecord,
  FilterKind,
  ListFilters,
} from '#/shared/utils/list-filter'

// The read the picker counts over: the whole list, or how far it stands
export type FilterPickerRead =
  | {
      status: 'reading' | 'failed'
      read: number
      total: number | undefined
      requestsLeft: number | undefined
    }
  | { status: 'read'; records: FilterableRecord[] }

interface FilterPickerBodyProps {
  list: 'collection' | 'wantlist'
  read: FilterPickerRead
  filters: ListFilters
  /** Every kind, the unset ones undefined, to merge into the URL search */
  onFiltersChange: (filters: ListFilters) => void
  onRetry: () => void
}

interface FilterPickerProps extends FilterPickerBodyProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

// Hundreds of artists: the first few, the rest on demand or by search
const ARTIST_PREVIEW = 12

// The Filter chip, next to the sort: opens the picker straight away, even
// before the list is read
export const FilterChip = ({ onClick }: { onClick: () => void }) => (
  <Chip aria-pressed={undefined} aria-haspopup="dialog" onClick={onClick}>
    <SlidersHorizontal size={14} aria-hidden />
    Filter
  </Chip>
)

// A sheet of four faceted sections over a whole list. Picking applies at
// once (the list behind updates, the counts narrow); the sheet stays open to
// combine kinds.
export const FilterPicker = ({
  open,
  onOpenChange,
  ...body
}: FilterPickerProps) => {
  const { read, filters } = body
  const matchCount = useMemo(
    () =>
      read.status === 'read'
        ? filterRecords(read.records, filters).length
        : undefined,
    [read, filters],
  )

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="sm:mx-auto sm:w-full sm:max-w-lg">
        <DrawerHeader className="px-6 text-left">
          <DrawerTitle className="type-display text-2xl">Filter</DrawerTitle>
          <DrawerDescription className="sr-only">
            Narrow your {body.list} by artist, style, Pressing decade or year
            added
          </DrawerDescription>
        </DrawerHeader>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-2">
          <FilterPickerBody {...body} />
        </div>
        {matchCount !== undefined && (
          <DrawerFooter className="px-6">
            <Button size="lg" onClick={() => onOpenChange(false)}>
              Show {formatRecords(matchCount)}
            </Button>
          </DrawerFooter>
        )}
      </DrawerContent>
    </Drawer>
  )
}

export const FilterPickerBody = ({
  list,
  read,
  filters,
  onFiltersChange,
  onRetry,
}: FilterPickerBodyProps) => {
  const records = read.status === 'read' ? read.records : undefined
  const facets = useMemo(
    () => records && listFacets(records, filters),
    [records, filters],
  )

  if (read.status === 'reading') {
    return (
      <ReadingState
        list={list}
        size="small"
        read={read.read}
        total={read.total}
        requestsLeft={read.requestsLeft}
        className="py-6"
      />
    )
  }

  if (read.status === 'failed' || !facets) {
    return (
      <p
        role="alert"
        className="type-catalogue flex flex-wrap items-center gap-3 py-6 text-sm text-muted-foreground"
      >
        Couldn't reach Discogs.
        <Button variant="outline" size="sm" onClick={onRetry}>
          Try again
        </Button>
      </p>
    )
  }

  // One value per kind: a pick replaces the kind's value, the active one clears
  const pick =
    <TKind extends FilterKind>(kind: TKind) =>
    (value: NonNullable<ListFilters[TKind]>) =>
      onFiltersChange({
        ...pickFilters(filters),
        [kind]: filters[kind] === value ? undefined : value,
      })

  return (
    <div className="flex flex-col gap-8 py-2">
      <ArtistSection
        values={facets.artist}
        active={filters.artist}
        onPick={pick('artist')}
      />
      <FacetSection
        title="Style"
        values={facets.style}
        active={filters.style}
        onPick={pick('style')}
      />
      <FacetSection
        title="Pressing decade"
        values={facets.decade}
        active={filters.decade}
        onPick={pick('decade')}
      />
      <FacetSection
        title="Added"
        values={facets.added}
        active={filters.added}
        onPick={pick('added')}
      />
    </div>
  )
}

interface FacetSectionProps<TValue> {
  title: string
  values: FacetValue<TValue>[]
  active: TValue | undefined
  onPick: (value: TValue) => void
  /** Above the values, e.g. the artist search */
  lead?: ReactNode
  /** Below the values, e.g. "All 340 artists" */
  trail?: ReactNode
  empty?: string
}

const FacetSection = <TValue extends string | number>({
  title,
  values,
  active,
  onPick,
  lead,
  trail,
  empty,
}: FacetSectionProps<TValue>) => {
  const headingId = useId()
  return (
    <section
      role="group"
      aria-labelledby={headingId}
      className="flex flex-col gap-3"
    >
      <h3 id={headingId} className="type-caps text-xs text-muted-foreground">
        {title}
      </h3>
      {lead}
      {values.length === 0 && empty ? (
        <p className="text-sm text-muted-foreground">{empty}</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {values.map(({ value, label, count }) => (
            <Chip
              key={value}
              active={value === active}
              onClick={() => onPick(value)}
            >
              {label}
              <span className="type-catalogue text-xs opacity-70">{count}</span>
            </Chip>
          ))}
        </div>
      )}
      {trail}
    </section>
  )
}

interface ArtistSectionProps {
  values: ReturnType<typeof listFacets>['artist']
  active: number | undefined
  onPick: (value: number) => void
}

const ArtistSection = ({ values, active, onPick }: ArtistSectionProps) => {
  const [query, setQuery] = useState('')
  const [showsAll, setShowsAll] = useState(false)
  const matches = searchArtists(values, query)
  const isCapped = !showsAll && !query.trim() && matches.length > ARTIST_PREVIEW
  // The active artist stays in view, wherever it ranks
  const shown = isCapped
    ? matches.filter(
        (artist, index) => index < ARTIST_PREVIEW || artist.value === active,
      )
    : matches

  return (
    <FacetSection
      title="Artist"
      values={shown}
      active={active}
      onPick={onPick}
      empty="No artist matches"
      lead={
        <Input
          type="search"
          aria-label="Search artists"
          placeholder="Search artists"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      }
      trail={
        isCapped && (
          <Button
            variant="link"
            size="sm"
            className="self-start px-0"
            onClick={() => setShowsAll(true)}
          >
            All {values.length} artists
          </Button>
        )
      }
    />
  )
}
