import type { QueryKey } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { X } from 'lucide-react'
import { useMemo } from 'react'
import type { ReactNode } from 'react'

import { ReadFailed } from '#/shared/components/ReadFailed'
import { ReadingState } from '#/shared/components/ReadingState'
import { RecordList } from '#/shared/components/RecordList'
import { Button } from '#/shared/components/ui/button'
import { Chip, ChipRow } from '#/shared/components/ui/chip'
import { useFullListRead } from '#/shared/hooks/use-full-list-read'
import type {
  FullListRead,
  FullListSource,
  ReadablePage,
} from '#/shared/hooks/use-full-list-read'
import { formatRecords } from '#/shared/utils/format-records'
import {
  activeFilters,
  filterArtistName,
  filterRecords,
} from '#/shared/utils/list-filter'
import type {
  FilterableRecord,
  FilterKind,
  ListFilters,
} from '#/shared/utils/list-filter'
import type { ListName } from '#/shared/utils/list-name'
import { sortRecords } from '#/shared/utils/list-sort'
import type { ListSort, SortableRecord } from '#/shared/utils/list-sort'

/** A record a list can be filtered and sorted by */
export type ListRecord = FilterableRecord & SortableRecord

interface FilteredListBaseProps<TRecord extends ListRecord> {
  filters: ListFilters
  listSort: ListSort
  onRemoveFilter: (kind: FilterKind) => void
  onClearFilters: () => void
  recordKey: (record: TRecord) => number
  /** A row, inside its list item */
  renderRecord: (record: TRecord) => ReactNode
}

interface FilteredListProps<
  TPage extends ReadablePage,
  TRecord extends ListRecord,
  TQueryKey extends QueryKey,
> extends FilteredListBaseProps<TRecord> {
  source: FullListSource<TPage, TRecord, TQueryKey>
}

interface FilteredListViewProps<
  TRecord extends ListRecord,
> extends FilteredListBaseProps<TRecord> {
  list: ListName
  read: FullListRead<TRecord>
  onRetry: () => void
}

// Discogs can't filter a list: filters run over the full read of it
export const FilteredList = <
  TPage extends ReadablePage,
  TRecord extends ListRecord,
  TQueryKey extends QueryKey,
>({
  source,
  ...props
}: FilteredListProps<TPage, TRecord, TQueryKey>) => {
  const { read, retry } = useFullListRead(source, true)
  return (
    <FilteredListView
      {...props}
      list={source.list}
      read={read}
      onRetry={retry}
    />
  )
}

// A Collection or Wantlist filtered over its full read (Discogs can't filter
// either): the reading state until every record is read, then the result
// whole. Never partial, never growing.
export const FilteredListView = <TRecord extends ListRecord>({
  list,
  filters,
  listSort,
  read,
  onRemoveFilter,
  onClearFilters,
  onRetry,
  recordKey,
  renderRecord,
}: FilteredListViewProps<TRecord>) => {
  const records = read.status === 'read' ? read.records : undefined
  const matches = useMemo(
    () => records && sortRecords(filterRecords(records, filters), listSort),
    [records, filters, listSort],
  )
  const artistName =
    records && filters.artist !== undefined
      ? filterArtistName(records, filters.artist)
      : undefined

  if (read.status === 'reading') {
    return (
      <div className="flex justify-center py-12">
        <ReadingState
          list={list}
          read={read.read}
          total={read.total}
          requestsLeft={read.requestsLeft}
        />
      </div>
    )
  }

  if (read.status === 'failed' || !matches) {
    return <ReadFailed onRetry={onRetry} />
  }

  return (
    <>
      <div className="mb-6 flex flex-col gap-3">
        <div className="flex items-baseline justify-between gap-4">
          <p className="type-catalogue text-sm text-muted-foreground">
            {formatRecords(matches.length)}
          </p>
          {filters.artist !== undefined && artistName && (
            <Link
              to="/search"
              search={{ artistId: String(filters.artist), artistName }}
              className="type-catalogue text-sm text-foreground underline"
            >
              Discography
            </Link>
          )}
        </div>
        <ChipRow role="group" aria-label="Filters">
          {activeFilters(filters, artistName).map(({ kind, label }) => (
            <Chip
              key={kind}
              active
              aria-pressed={undefined}
              aria-label={`Remove ${label}`}
              onClick={() => onRemoveFilter(kind)}
            >
              {label}
              <X size={14} aria-hidden />
            </Chip>
          ))}
        </ChipRow>
      </div>

      {matches.length === 0 ? (
        <div className="flex flex-col items-start gap-3">
          <p className="text-muted-foreground">No records match</p>
          <Button variant="outline" size="sm" onClick={onClearFilters}>
            Clear filters
          </Button>
        </div>
      ) : (
        <RecordList>
          {matches.map((record) => (
            <li key={recordKey(record)}>{renderRecord(record)}</li>
          ))}
        </RecordList>
      )}
    </>
  )
}
