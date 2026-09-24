import {
  fetchCollectionCount,
  fetchRandomRecord,
  getCollection,
} from './collection.api'
import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query'
import { getDeezerCover } from '#/services/deezer.api'
import type { ListSort } from '#/shared/utils/list-sort'

export const collectionCountQueryOptions = (username: string) =>
  queryOptions({
    queryKey: ['collection', username, 'count'] as const,
    queryFn: () => fetchCollectionCount(),
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
