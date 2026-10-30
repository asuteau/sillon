import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import type {
  InfiniteData,
  QueryKey,
  UseInfiniteQueryOptions,
} from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'

import { readProgress, readRecords } from '#/shared/utils/full-read'
import type {
  ListPagination,
  ListReader,
  ReadProgress,
} from '#/shared/utils/full-read'
import { nextReadDelay } from '#/shared/utils/paced-read'

export type FullListRead<TRecord> =
  | ({ status: 'reading' } & ReadProgress)
  | ({ status: 'failed' } & ReadProgress)
  /** Every record, once each, in the list's order */
  | { status: 'read'; records: TRecord[] }

/** A list page stamped with when it was asked of Discogs, to pace the next */
type ReadablePage = { pagination: ListPagination; fetchedAt: number }

type ListPages<TPage> = InfiniteData<TPage>

// Reads a whole Discogs list through its one cache (persisted or not is the
// query's own business), one paced page at a time, from wherever it stands.
// The records come only once every one is read, never partial.
export const useFullListRead = <
  TPage extends ReadablePage,
  TRecord,
  TQueryKey extends QueryKey,
>(
  options: UseInfiniteQueryOptions<
    TPage,
    Error,
    ListPages<TPage>,
    TQueryKey,
    number
  >,
  reader: ListReader<TPage, TRecord>,
  enabled: boolean,
): { read: FullListRead<TRecord>; retry: () => void } => {
  const queryClient = useQueryClient()
  const { data, hasNextPage, isFetching, isError, fetchNextPage, refetch } =
    useInfiniteQuery({ ...options, enabled })
  const progress = readProgress(data?.pages, reader)
  const [hasReread, setHasReread] = useState(false)

  // Keyed on the pages read too: two pages can share a fetch time, and the
  // fetch in between may never surface as a render
  const pagesRead = data?.pages.length ?? 0
  const lastFetchedAt = data?.pages.at(-1)?.fetchedAt
  useEffect(() => {
    if (
      !enabled ||
      !hasNextPage ||
      isFetching ||
      isError ||
      lastFetchedAt === undefined
    )
      return
    const timer = setTimeout(
      () => void fetchNextPage(),
      nextReadDelay(lastFetchedAt, Date.now()),
    )
    return () => clearTimeout(timer)
  }, [
    enabled,
    hasNextPage,
    isFetching,
    isError,
    pagesRead,
    lastFetchedAt,
    fetchNextPage,
  ])

  // Records skipped: read again from the first page, paced like any read.
  // Once only, so a Discogs count that is itself off can't loop.
  const { hasGap } = progress
  const { queryKey } = options
  useEffect(() => {
    if (!hasGap || hasReread || isFetching) return
    setHasReread(true)
    queryClient.setQueryData<ListPages<TPage>>(
      queryKey,
      (old) =>
        old && {
          pages: old.pages.slice(0, 1),
          pageParams: old.pageParams.slice(0, 1),
        },
    )
    void refetch()
  }, [hasGap, hasReread, isFetching, queryClient, queryKey, refetch])

  const isRead = progress.isComplete || (hasGap && hasReread)
  const read = useMemo((): FullListRead<TRecord> => {
    if (!isRead || !data)
      return {
        status: isError ? 'failed' : 'reading',
        ...readProgress(data?.pages, reader),
      }
    return { status: 'read', records: readRecords(data.pages, reader) }
  }, [data, isError, isRead, reader])

  // A failed first page has nothing to continue from
  const retry = () => void (data ? fetchNextPage() : refetch())

  return { read, retry }
}
