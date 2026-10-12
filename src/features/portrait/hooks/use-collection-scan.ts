import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'

import { newestFirstQueryOptions } from '#/features/collection/collection.queries'
import type { CollectionPages } from '#/features/collection/collection.queries'

import {
  additionsByYear,
  nextReadDelay,
  pressingDecades,
  scanProgress,
  topArtists,
  topStyles,
} from '../portrait.model'
import type {
  PressingDecades,
  ScanProgress,
  TopArtist,
  TopStyle,
  YearCount,
} from '../portrait.model'

export type CollectionScan =
  | ({ status: 'reading' } & ScanProgress)
  | ({ status: 'failed' } & ScanProgress)
  | {
      status: 'read'
      topArtists: TopArtist[]
      topStyles: TopStyle[]
      pressingDecades: PressingDecades
      additionsByYear: YearCount[]
    }

// Reads the whole Collection through the shared Collection list cache, one
// paced page at a time, from wherever it stands. Figures come only once every
// Copy is read, never partial. Off for an empty Collection.
export const useCollectionScan = (
  enabled: boolean,
): { scan: CollectionScan; retry: () => void } => {
  const queryClient = useQueryClient()
  const { data, hasNextPage, isFetching, isError, fetchNextPage, refetch } =
    useInfiniteQuery({ ...newestFirstQueryOptions, enabled })
  const progress = scanProgress(data)
  const [hasRescanned, setHasRescanned] = useState(false)

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

  // Copies skipped: read again from the first page, paced like any scan. Once
  // only, so a Discogs count that is itself off can't loop.
  const { hasGap } = progress
  useEffect(() => {
    if (!hasGap || hasRescanned || isFetching) return
    setHasRescanned(true)
    queryClient.setQueryData<CollectionPages>(
      newestFirstQueryOptions.queryKey,
      (old) =>
        old && {
          pages: old.pages.slice(0, 1),
          pageParams: old.pageParams.slice(0, 1),
        },
    )
    void refetch()
  }, [hasGap, hasRescanned, isFetching, queryClient, refetch])

  const isRead = progress.isComplete || (hasGap && hasRescanned)
  const scan = useMemo((): CollectionScan => {
    if (!isRead || !data)
      return isError
        ? { status: 'failed', ...scanProgress(data) }
        : { status: 'reading', ...scanProgress(data) }
    const releases = data.pages.flatMap((page) => page.releases)
    return {
      status: 'read',
      topArtists: topArtists(releases),
      topStyles: topStyles(releases),
      pressingDecades: pressingDecades(releases),
      additionsByYear: additionsByYear(releases),
    }
  }, [data, isError, isRead])

  // A failed first page has nothing to continue from
  const retry = () => void (data ? fetchNextPage() : refetch())

  return { scan, retry }
}
