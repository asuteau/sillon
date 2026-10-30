import type { QueryKey } from '@tanstack/react-query'
import { SlidersHorizontal } from 'lucide-react'
import { useId, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

import { ReadFailed } from '#/shared/components/ReadFailed'
import { ReadingState } from '#/shared/components/ReadingState'
import { Button } from '#/shared/components/ui/button'
import { Chip } from '#/shared/components/ui/chip'
import { cn } from '#/shared/utils/cn'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '#/shared/components/ui/drawer'
import { Input } from '#/shared/components/ui/input'
import { useFullListRead } from '#/shared/hooks/use-full-list-read'
import type {
  FullListRead,
  FullListSource,
  ReadablePage,
} from '#/shared/hooks/use-full-list-read'
import { formatRecords } from '#/shared/utils/format-records'
import { listFilterOptions, searchArtists } from '#/shared/utils/filter-options'
import type { FilterOption } from '#/shared/utils/filter-options'
import { filterRecords, pickFilters } from '#/shared/utils/list-filter'
import type { ListName } from '#/shared/utils/list-name'
import type {
  FilterableRecord,
  FilterKind,
  ListFilters,
} from '#/shared/utils/list-filter'

interface FilterPickerBodyProps {
  list: ListName
  /** The read the picker counts over: the whole list, or how far it stands */
  read: FullListRead<FilterableRecord>
  filters: ListFilters
  /** Every kind, the unset ones undefined, to merge into the URL search */
  onFiltersChange: (filters: ListFilters) => void
  onRetry: () => void
}

interface FilterPickerProps extends FilterPickerBodyProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

// Every kind shows its first few values, the rest on demand (or, for
// artists, by search)
const PREVIEW_COUNT = 5

// The Filter chip, next to the sort: opens the picker straight away, even
// before the list is read
export const FilterChip = ({ onClick }: { onClick: () => void }) => (
  <Chip aria-pressed={undefined} aria-haspopup="dialog" onClick={onClick}>
    <SlidersHorizontal size={14} aria-hidden />
    Filter
  </Chip>
)

interface ListFilterPickerProps<
  TPage extends ReadablePage,
  TRecord extends FilterableRecord,
  TQueryKey extends QueryKey,
> {
  source: FullListSource<TPage, TRecord, TQueryKey>
  filters: ListFilters
  onFiltersChange: (filters: ListFilters) => void
}

// The Filter chip and its sheet. Opening it starts the full read of the list
// the Filter options count over; the filtered list then reuses it.
export const ListFilterPicker = <
  TPage extends ReadablePage,
  TRecord extends FilterableRecord,
  TQueryKey extends QueryKey,
>({
  source,
  filters,
  onFiltersChange,
}: ListFilterPickerProps<TPage, TRecord, TQueryKey>) => {
  const [open, setOpen] = useState(false)
  const { read, retry } = useFullListRead(source, open)

  return (
    <>
      <FilterChip onClick={() => setOpen(true)} />
      <FilterPicker
        list={source.list}
        open={open}
        onOpenChange={setOpen}
        read={read}
        filters={filters}
        onFiltersChange={onFiltersChange}
        onRetry={retry}
      />
    </>
  )
}

// A sheet of four sections of Filter options over a whole list. Picking applies at
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
  const options = useMemo(
    () => records && listFilterOptions(records, filters),
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

  if (read.status === 'failed' || !options) {
    return <ReadFailed onRetry={onRetry} className="py-6" />
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
        values={options.artist}
        active={filters.artist}
        onPick={pick('artist')}
      />
      <FilterSection
        title="Style"
        noun="styles"
        values={options.style}
        active={filters.style}
        onPick={pick('style')}
      />
      <FilterSection
        title="Pressing decade"
        noun="pressing decades"
        values={options.decade}
        active={filters.decade}
        onPick={pick('decade')}
      />
      <FilterSection
        title="Added year"
        noun="years"
        values={options.added}
        active={filters.added}
        onPick={pick('added')}
      />
    </div>
  )
}

interface FilterSectionProps<TValue> {
  title: string
  values: FilterOption<TValue>[]
  active: TValue | undefined
  onPick: (value: TValue) => void
  /** Plural, for "All 40 styles" */
  noun: string
  /** Shows every value, e.g. while searching artists */
  uncapped?: boolean
  /** Above the values, e.g. the artist search */
  lead?: ReactNode
  empty?: string
}

const FilterSection = <TValue extends string | number>({
  title,
  values,
  active,
  onPick,
  noun,
  uncapped = false,
  lead,
  empty,
}: FilterSectionProps<TValue>) => {
  const headingId = useId()
  const [showsAll, setShowsAll] = useState(false)
  const isCapped = !showsAll && !uncapped && values.length > PREVIEW_COUNT
  // The active value stays in view, wherever it ranks
  const shown = isCapped
    ? values.filter(
        (option, index) => index < PREVIEW_COUNT || option.value === active,
      )
    : values

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
          {shown.map(({ value, label, count }) => (
            <Chip
              key={value}
              active={value === active}
              onClick={() => onPick(value)}
              // The value in full ink, its count muted beside it
              className={cn('gap-1.5', value !== active && 'text-foreground')}
            >
              {label}
              <span
                className={cn(
                  'type-catalogue text-xs',
                  value === active ? 'opacity-70' : 'text-muted-foreground',
                )}
              >
                {count}
              </span>
            </Chip>
          ))}
        </div>
      )}
      {isCapped && (
        <Button
          variant="link"
          size="sm"
          className="self-start px-0"
          onClick={() => setShowsAll(true)}
        >
          All {values.length} {noun}
        </Button>
      )}
    </section>
  )
}

interface ArtistSectionProps {
  values: ReturnType<typeof listFilterOptions>['artist']
  active: number | undefined
  onPick: (value: number) => void
}

const ArtistSection = ({ values, active, onPick }: ArtistSectionProps) => {
  const [query, setQuery] = useState('')

  return (
    <FilterSection
      title="Artist"
      noun="artists"
      values={searchArtists(values, query)}
      active={active}
      onPick={onPick}
      uncapped={query.trim() !== ''}
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
    />
  )
}
