import { Link } from '@tanstack/react-router'
import { X } from 'lucide-react'
import { useMemo } from 'react'
import type { ReactNode } from 'react'

import { ReadingState } from '#/shared/components/ReadingState'
import { RecordList } from '#/shared/components/RecordList'
import { Button } from '#/shared/components/ui/button'
import { Chip, ChipRow } from '#/shared/components/ui/chip'
import type { FullListRead } from '#/shared/hooks/use-full-list-read'
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
import { sortRecords } from '#/shared/utils/list-sort'
import type { ListSort, SortableRecord } from '#/shared/utils/list-sort'

export interface FilteredListProps {
  filters: ListFilters
  listSort: ListSort
  onRemoveFilter: (kind: FilterKind) => void
  onClearFilters: () => void
}

interface FilteredListViewProps<
  TRecord extends FilterableRecord & SortableRecord,
> extends FilteredListProps {
  list: 'collection' | 'wantlist'
  read: FullListRead<TRecord>
  onRetry: () => void
  recordKey: (record: TRecord) => number
  /** A row, inside its list item */
  renderRecord: (record: TRecord) => ReactNode
}

// A Collection or Wantlist filtered over its full read (Discogs can't filter
// either): the reading state until every record is read, then the result
// whole. Never partial, never growing.
export const FilteredListView = <
  TRecord extends FilterableRecord & SortableRecord,
>({
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
    return (
      <p
        role="alert"
        className="type-catalogue flex flex-wrap items-center gap-3 text-sm text-muted-foreground"
      >
        Couldn't reach Discogs.
        <Button variant="outline" size="sm" onClick={onRetry}>
          Try again
        </Button>
      </p>
    )
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
