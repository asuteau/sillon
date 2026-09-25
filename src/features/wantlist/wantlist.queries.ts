import { hashKey, infiniteQueryOptions } from '@tanstack/react-query'
import type { InfiniteData, QueryClient } from '@tanstack/react-query'

import type { ListSort } from '#/shared/utils/list-sort'

import { getWantlist } from './wantlist.api'
import type { WantlistItem, WantlistPage } from './wantlist.schema'

// Prefix shared by every sorted list, used for invalidation
export const wantlistListQueryKey = ['wantlist', 'list'] as const

export const wantlistQueryOptions = (listSort: ListSort) =>
  infiniteQueryOptions({
    queryKey: [...wantlistListQueryKey, { perPage: 20, ...listSort }],
    queryFn: ({ pageParam }) =>
      getWantlist({ data: { perPage: 20, page: pageParam, ...listSort } }),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.pagination.page < last.pagination.pages
        ? last.pagination.page + 1
        : undefined,
    staleTime: 10 * 60 * 1000,
    refetchOnMount: false,
  })

type WantlistPages = InfiniteData<WantlistPage, number>

const newestFirstQueryKey = wantlistQueryOptions({
  sort: 'added',
  order: 'desc',
}).queryKey

const adjustItems = (page: WantlistPage, delta: 1 | -1): WantlistPage => ({
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
