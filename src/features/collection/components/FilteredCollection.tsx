import { Link } from '@tanstack/react-router'
import { X } from 'lucide-react'
import { useMemo } from 'react'

import { ReadingState } from '#/shared/components/ReadingState'
import { RecordList } from '#/shared/components/RecordList'
import { Button } from '#/shared/components/ui/button'
import { Chip, ChipRow } from '#/shared/components/ui/chip'
import {
  activeFilters,
  filterArtistName,
  filterRecords,
} from '#/shared/utils/list-filter'
import type { FilterKind, ListFilters } from '#/shared/utils/list-filter'
import { sortRecords } from '#/shared/utils/list-sort'
import type { ListSort } from '#/shared/utils/list-sort'

import type { CollectionRelease } from '../collection.schema'
import { formatListMeta, formatRecords } from '../collection.utils'
import { useFullCollectionRead } from '../hooks/use-full-collection-read'
import type { FullCollectionRead } from '../hooks/use-full-collection-read'
import { ReleaseRow } from './ReleaseRow'

interface FilteredCollectionProps {
  filters: ListFilters
  listSort: ListSort
  onRemoveFilter: (kind: FilterKind) => void
  onClearFilters: () => void
  onSelect: (release: CollectionRelease) => void
}

// Discogs can't filter a Collection: filters run over the full read of it
export const FilteredCollection = (props: FilteredCollectionProps) => {
  const { read, retry } = useFullCollectionRead(true)
  return <FilteredCollectionView {...props} read={read} onRetry={retry} />
}

interface FilteredCollectionViewProps extends FilteredCollectionProps {
  read: FullCollectionRead
  onRetry: () => void
}

// The reading state until every Copy is read, then the result whole: never
// partial, never growing
export const FilteredCollectionView = ({
  filters,
  listSort,
  read,
  onRemoveFilter,
  onClearFilters,
  onRetry,
  onSelect,
}: FilteredCollectionViewProps) => {
  const copies = read.status === 'read' ? read.copies : undefined
  const matches = useMemo(
    () => copies && sortRecords(filterRecords(copies, filters), listSort),
    [copies, filters, listSort],
  )
  const artistName =
    copies && filters.artist !== undefined
      ? filterArtistName(copies, filters.artist)
      : undefined

  if (read.status === 'reading') {
    return (
      <div className="flex justify-center py-12">
        <ReadingState
          list="collection"
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
          {matches.map((release) => (
            <li key={release.instance_id}>
              <ReleaseRow
                release={release}
                meta={formatListMeta(release, listSort.sort)}
                onClick={() => onSelect(release)}
              />
            </li>
          ))}
        </RecordList>
      )}
    </>
  )
}
