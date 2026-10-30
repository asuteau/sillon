import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'

import { nextReadDelay } from '#/shared/utils/paced-read'

import { readProgress, uniqueCopies } from '../collection.model'
import type { ReadProgress } from '../collection.model'
import { newestFirstQueryOptions } from '../collection.queries'
import type { CollectionPages } from '../collection.queries'
import type { CollectionRelease } from '../collection.schema'

export type FullCollectionRead =
  | ({ status: 'reading' } & ReadProgress)
  | ({ status: 'failed' } & ReadProgress)
  /** Every Copy, once each, newest first */
  | { status: 'read'; copies: CollectionRelease[] }

// Reads the whole Collection through the one Collection cache (persisted,
// ADR 0004), one paced page at a time, from wherever it stands. The Copies
// come only once every one is read, never partial. Off for an empty
// Collection.
export const useFullCollectionRead = (
  enabled: boolean,
): { read: FullCollectionRead; retry: () => void } => {
  const queryClient = useQueryClient()
  const { data, hasNextPage, isFetching, isError, fetchNextPage, refetch } =
    useInfiniteQuery({ ...newestFirstQueryOptions, enabled })
  const progress = readProgress(data)
  const [hasReread, setHasReread] = useState(false)

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
  }, [enabled, hasNextPage, isFetching, isError, lastFetchedAt, fetchNextPage])

  // Copies skipped: read again from the first page, paced like any read. Once
  // only, so a Discogs count that is itself off can't loop.
  const { hasGap } = progress
  useEffect(() => {
    if (!hasGap || hasReread || isFetching) return
    setHasReread(true)
    queryClient.setQueryData<CollectionPages>(
      newestFirstQueryOptions.queryKey,
      (old) =>
        old && {
          pages: old.pages.slice(0, 1),
          pageParams: old.pageParams.slice(0, 1),
        },
    )
    void refetch()
  }, [hasGap, hasReread, isFetching, queryClient, refetch])

  const isRead = progress.isComplete || (hasGap && hasReread)
  const read = useMemo((): FullCollectionRead => {
    if (!isRead || !data)
      return isError
        ? { status: 'failed', ...readProgress(data) }
        : { status: 'reading', ...readProgress(data) }
    return {
      status: 'read',
      copies: uniqueCopies(data.pages.flatMap((page) => page.releases)),
    }
  }, [data, isError, isRead])

  // A failed first page has nothing to continue from
  const retry = () => void (data ? fetchNextPage() : refetch())

  return { read, retry }
}
