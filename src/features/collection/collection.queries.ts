import {
  fetchRandomRecord,
  getCollection,
  getCollectionValue,
} from './collection.api'
import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query'
import { getDeezerCover } from '#/services/deezer.api'
import type { ListSort } from '#/shared/utils/list-sort'

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
