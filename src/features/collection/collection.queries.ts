import {
  fetchRandomRecord,
  getCollection,
  getCollectionValue,
} from './collection.api'
import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query'
import type { InfiniteData, QueryClient } from '@tanstack/react-query'
import { getDeezerCover } from '#/services/deezer.api'
import type { ListSort } from '#/shared/utils/list-sort'

import type { CollectionPage } from './collection.schema'

// Only changes with the Collection itself — mutations invalidate it
export const collectionValueQueryOptions = (username: string) =>
  queryOptions({
    queryKey: ['collection', username, 'value'] as const,
    queryFn: () => getCollectionValue(),
    staleTime: 60 * 60 * 1000,
  })

export const recentAdditionsQueryOptions = queryOptions({
  queryKey: ['collection', { perPage: 10 }],
  queryFn: () =>
    getCollection({ data: { perPage: 10, sort: 'added', order: 'desc' } }),
  staleTime: 10 * 60 * 1000,
})

// Prefix shared by every sorted list, used for invalidation
export const collectionListQueryKey = ['collection', 'list'] as const

export const collectionQueryOptions = (listSort: ListSort) =>
  infiniteQueryOptions({
    queryKey: [...collectionListQueryKey, { perPage: 20, ...listSort }],
    queryFn: ({ pageParam }) =>
      getCollection({ data: { perPage: 20, page: pageParam, ...listSort } }),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.pagination.page < last.pagination.pages
        ? last.pagination.page + 1
        : undefined,
    staleTime: 10 * 60 * 1000,
    refetchOnMount: false,
  })

export const coverArtQueryOptions = (
  releaseId: string,
  artist: string,
  title: string,
) =>
  queryOptions({
    queryKey: ['cover', 'v3', releaseId],
    queryFn: () => getDeezerCover({ data: { artist, title } }),
    staleTime: Infinity,
    gcTime: Infinity,
    retry: false,
  })

export const randomRecordQueryOptions = queryOptions({
  queryKey: ['collection', 'random'],
  queryFn: () => fetchRandomRecord(),
  staleTime: 0,
  gcTime: 0,
  enabled: false,
})

const withoutCopy = (
  page: CollectionPage,
  instanceId: number,
): CollectionPage => ({
  releases: page.releases.filter((r) => r.instance_id !== instanceId),
  pagination: {
    ...page.pagination,
    items: Math.max(0, page.pagination.items - 1),
  },
})

// Discogs reads lag behind writes, so cached lists are patched from the
// mutation result instead of refetched
export function removeCopyFromLists(
  queryClient: QueryClient,
  instanceId: number,
) {
  queryClient.setQueriesData<InfiniteData<CollectionPage, number>>(
    { queryKey: collectionListQueryKey },
    (old) =>
      old
        ? {
            ...old,
            pages: old.pages.map((page) => withoutCopy(page, instanceId)),
          }
        : old,
  )
  queryClient.setQueryData<CollectionPage>(
    recentAdditionsQueryOptions.queryKey,
    (old) => (old ? withoutCopy(old, instanceId) : old),
  )
}
