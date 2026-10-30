import { useSuspenseInfiniteQuery } from '@tanstack/react-query'
import type {
  InfiniteData,
  QueryKey,
  UseSuspenseInfiniteQueryOptions,
} from '@tanstack/react-query'
import { useMemo } from 'react'
import type { ReactNode } from 'react'

import { GrooveLoader } from '#/shared/components/brand/GrooveLoader'
import { FilteredList } from '#/shared/components/FilteredList'
import type { ListRecord } from '#/shared/components/FilteredList'
import { ListFilterPicker } from '#/shared/components/FilterPicker'
import { RecordList } from '#/shared/components/RecordList'
import { SortChips } from '#/shared/components/SortChips'
import { Button } from '#/shared/components/ui/button'
import { useFullListRead } from '#/shared/hooks/use-full-list-read'
import type {
  FullListSource,
  ReadablePage,
} from '#/shared/hooks/use-full-list-read'
import { useListSearch } from '#/shared/hooks/use-list-search'
import type { ListPath, ListSearch } from '#/shared/hooks/use-list-search'
import { readRecords } from '#/shared/utils/full-read'
import { hasFilters } from '#/shared/utils/list-filter'
import { sortRecords } from '#/shared/utils/list-sort'
import type { ListSort } from '#/shared/utils/list-sort'

/** How a Collection or Wantlist is read, sorted and shown */
export interface ListConfig<
  TPage extends ReadablePage,
  TRecord extends ListRecord,
  TQueryKey extends QueryKey,
> {
  /** The full read, newest first, filters run over */
  source: FullListSource<TPage, TRecord, TQueryKey>
  /** The list as Discogs sorts it, a page at a time */
  pagedOptions: (
    listSort: ListSort,
  ) => UseSuspenseInfiniteQueryOptions<
    TPage,
    Error,
    InfiniteData<TPage>,
    TQueryKey,
    number
  >
  /** Shown when the list holds no record */
  empty: string
  /** Once the full read is whole, the unfiltered list sorts it on the device
   *  instead of asking Discogs for each sort */
  servesWholeRead?: boolean
}

interface ListViewProps<
  TPage extends ReadablePage,
  TRecord extends ListRecord,
  TQueryKey extends QueryKey,
> {
  config: ListConfig<TPage, TRecord, TQueryKey>
  path: ListPath
  search: ListSearch
  title: string
  /** Beside the title, once the list holds records */
  action?: ReactNode
  /** A row, inside its list item */
  renderRecord: (record: TRecord, listSort: ListSort) => ReactNode
}

// A Collection or Wantlist: its sort and filters, then its records, whole
// list or filtered
export const ListView = <
  TPage extends ReadablePage,
  TRecord extends ListRecord,
  TQueryKey extends QueryKey,
>({
  config,
  path,
  search,
  title,
  action,
  renderRecord,
}: ListViewProps<TPage, TRecord, TQueryKey>) => {
  const {
    listSort,
    filters,
    isSortPending,
    handleSortSelect,
    handleRemoveFilter,
    handleFiltersChange,
    handleClearFilters,
  } = useListSearch(path, search)

  const heading = (hasRecords: boolean) => (
    <>
      <header className="mb-6 flex items-end justify-between gap-4">
        <h1 className="type-display text-4xl text-foreground">{title}</h1>
        {hasRecords && action}
      </header>
      <div className="mb-6 flex items-center gap-2">
        {hasRecords && (
          <>
            <ListFilterPicker
              source={config.source}
              filters={filters}
              onFiltersChange={handleFiltersChange}
            />
            <span aria-hidden className="h-5 w-px shrink-0 bg-border" />
          </>
        )}
        <SortChips
          value={listSort}
          onSelect={handleSortSelect}
          isPending={isSortPending}
          className="mb-0 min-w-0 flex-1"
        />
      </div>
    </>
  )

  if (hasFilters(filters)) {
    return (
      <>
        {heading(true)}
        <FilteredList
          source={config.source}
          filters={filters}
          listSort={listSort}
          onRemoveFilter={handleRemoveFilter}
          onClearFilters={handleClearFilters}
          recordKey={config.source.reader.keyOf}
          renderRecord={(record) => renderRecord(record, listSort)}
        />
      </>
    )
  }

  return (
    <ListRecords
      config={config}
      listSort={listSort}
      isSortPending={isSortPending}
      heading={heading}
      renderRecord={renderRecord}
    />
  )
}

interface ListRecordsProps<
  TPage extends ReadablePage,
  TRecord extends ListRecord,
  TQueryKey extends QueryKey,
> {
  config: ListConfig<TPage, TRecord, TQueryKey>
  listSort: ListSort
  isSortPending: boolean
  /** The title, filter and sort above the records */
  heading: (hasRecords: boolean) => ReactNode
  renderRecord: (record: TRecord, listSort: ListSort) => ReactNode
}

// The whole list, unfiltered
export const ListRecords = <
  TPage extends ReadablePage,
  TRecord extends ListRecord,
  TQueryKey extends QueryKey,
>(
  props: ListRecordsProps<TPage, TRecord, TQueryKey>,
) => {
  // Fixed per list, so the same hooks run on every render
  if (props.config.servesWholeRead) return <WholeOrPagedRecords {...props} />
  return <PagedRecords {...props} />
}

// From the full read once it is whole (opening the picker reads it), sorted
// on the device; until then, a page at a time from Discogs
const WholeOrPagedRecords = <
  TPage extends ReadablePage,
  TRecord extends ListRecord,
  TQueryKey extends QueryKey,
>(
  props: ListRecordsProps<TPage, TRecord, TQueryKey>,
) => {
  const { config, listSort, isSortPending, heading, renderRecord } = props
  // Off: reads only what the cache holds, never asks Discogs
  const { read } = useFullListRead(config.source, false)
  const records = read.status === 'read' ? read.records : undefined
  const sorted = useMemo(
    () => records && sortRecords(records, listSort),
    [records, listSort],
  )

  if (!sorted) return <PagedRecords {...props} />

  return (
    <RecordRows
      records={sorted}
      config={config}
      listSort={listSort}
      isSortPending={isSortPending}
      heading={heading}
      renderRecord={renderRecord}
    />
  )
}

// As Discogs sorts it, a page at a time
const PagedRecords = <
  TPage extends ReadablePage,
  TRecord extends ListRecord,
  TQueryKey extends QueryKey,
>({
  config,
  listSort,
  isSortPending,
  heading,
  renderRecord,
}: ListRecordsProps<TPage, TRecord, TQueryKey>) => {
  const { data, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useSuspenseInfiniteQuery(config.pagedOptions(listSort))
  const { reader } = config.source
  const records = useMemo(
    () => readRecords(data.pages, reader),
    [data.pages, reader],
  )

  return (
    <RecordRows
      records={records}
      config={config}
      listSort={listSort}
      isSortPending={isSortPending}
      heading={heading}
      renderRecord={renderRecord}
    >
      {hasNextPage && (
        <div className="mt-6 flex justify-center">
          <Button
            variant="outline"
            size="lg"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? (
              <>
                Loading…
                <GrooveLoader size={14} />
              </>
            ) : (
              'Load more'
            )}
          </Button>
        </div>
      )}
    </RecordRows>
  )
}

interface RecordRowsProps<
  TPage extends ReadablePage,
  TRecord extends ListRecord,
  TQueryKey extends QueryKey,
> extends ListRecordsProps<TPage, TRecord, TQueryKey> {
  records: TRecord[]
  /** Below the rows, e.g. Load more */
  children?: ReactNode
}

const RecordRows = <
  TPage extends ReadablePage,
  TRecord extends ListRecord,
  TQueryKey extends QueryKey,
>({
  records,
  config,
  listSort,
  isSortPending,
  heading,
  renderRecord,
  children,
}: RecordRowsProps<TPage, TRecord, TQueryKey>) => {
  if (records.length === 0) {
    return (
      <>
        {heading(false)}
        <p className="text-muted-foreground">{config.empty}</p>
      </>
    )
  }

  return (
    <>
      {heading(true)}
      <RecordList aria-busy={isSortPending}>
        {records.map((record) => (
          <li key={config.source.reader.keyOf(record)}>
            {renderRecord(record, listSort)}
          </li>
        ))}
      </RecordList>
      {children}
    </>
  )
}
