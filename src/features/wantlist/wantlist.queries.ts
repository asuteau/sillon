import { hashKey, infiniteQueryOptions } from '@tanstack/react-query'
import type { InfiniteData, QueryClient } from '@tanstack/react-query'

import type { ListSort } from '#/shared/utils/list-sort'

import { getWantlist } from './wantlist.api'
import type { WantlistItem, WantlistPage } from './wantlist.schema'

// Prefix shared by every sorted list, used for invalidation
export const wantlistListQueryKey = ['wantlist', 'list'] as const

// Discogs' largest page: fewest requests to read the whole Wantlist
const WANTLIST_PER_PAGE = 100

/** A page stamped with when it was asked of Discogs, to pace a full read */
export type WantlistListPage = WantlistPage & { fetchedAt: number }

// In memory only: ADR 0004 persists the Collection alone
export const wantlistQueryOptions = (listSort: ListSort) =>
  infiniteQueryOptions({
    queryKey: [
      ...wantlistListQueryKey,
      { perPage: WANTLIST_PER_PAGE, ...listSort },
    ],
    queryFn: async ({ pageParam }): Promise<WantlistListPage> => {
      const fetchedAt = Date.now()
      const page = await getWantlist({
        data: { perPage: WANTLIST_PER_PAGE, page: pageParam, ...listSort },
      })
      return { ...page, fetchedAt }
    },
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.pagination.page < last.pagination.pages
        ? last.pagination.page + 1
        : undefined,
    staleTime: 10 * 60 * 1000,
    refetchOnMount: false,
    // A refetch re-reads every loaded page back to back, unpaced: a fully
    // read Wantlist would spend most of Discogs' minute on one tab focus
    refetchOnWindowFocus: false,
  })

type WantlistPages = InfiniteData<WantlistListPage, number>

// The default list, and the one the full read for Filters goes through
export const newestFirstWantlistQueryOptions = wantlistQueryOptions({
  sort: 'added',
  order: 'desc',
})

const newestFirstQueryKey = newestFirstWantlistQueryOptions.queryKey

const adjustItems = (
  page: WantlistListPage,
  delta: 1 | -1,
): WantlistListPage => ({
  ...page,
  pagination: {
    ...page.pagination,
    items: Math.max(0, page.pagination.items + delta),
  },
})

// Discogs reads lag behind writes, so cached lists are patched from the
// mutation result instead of refetched
export function addWantToLists(queryClient: QueryClient, want: WantlistItem) {
  queryClient.setQueryData<WantlistPages>(newestFirstQueryKey, (old) =>
    old
      ? {
          ...old,
          pages: old.pages.map((page, index) =>
            adjustItems(
              {
                ...page,
                wants: [
                  ...(index === 0 ? [want] : []),
                  ...page.wants.filter((w) => w.id !== want.id),
                ],
              },
              1,
            ),
          ),
        }
      : old,
  )
  // Other sorts can't place the new Want: refetch them on next visit only
  queryClient.invalidateQueries({
    queryKey: wantlistListQueryKey,
    predicate: (query) => query.queryHash !== hashKey(newestFirstQueryKey),
    refetchType: 'none',
  })
}

export function removeWantFromLists(
  queryClient: QueryClient,
  releaseId: number,
) {
  queryClient.setQueriesData<WantlistPages>(
    { queryKey: wantlistListQueryKey },
    (old) =>
      old
        ? {
            ...old,
            pages: old.pages.map((page) =>
              adjustItems(
                {
                  ...page,
                  wants: page.wants.filter((w) => w.id !== releaseId),
                },
                -1,
              ),
            ),
          }
        : old,
  )
}
