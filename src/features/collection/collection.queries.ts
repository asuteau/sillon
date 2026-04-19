import { fetchRandomRecord, getRecentAdditions } from './collection.api'
import { createServerFn } from '@tanstack/react-start'
import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query'
import { getDeezerCover } from '#/services/deezer.api'

const getCollectionCount = createServerFn().handler(async () => {
  const { useAppSession } = await import('#/services/session.server')
  const session = await useAppSession()
  return session.data.numCollection ?? 0
})

export const collectionCountQueryOptions = (username: string) =>
  queryOptions({
    queryKey: ['collection', username, 'count'] as const,
    queryFn: () => getCollectionCount(),
    staleTime: Infinity,
  })

export const recentAdditionsQueryOptions = queryOptions({
  queryKey: ['collection', { perPage: 10 }],
  queryFn: () => getRecentAdditions({ data: { perPage: 10 } }),
  staleTime: 10 * 60 * 1000,
  refetchOnMount: false,
})

export const collectionQueryOptions = infiniteQueryOptions({
  queryKey: ['collection', { perPage: 20 }],
  queryFn: ({ pageParam }) =>
    getRecentAdditions({ data: { perPage: 20, page: pageParam } }),
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
    queryKey: ['cover', releaseId],
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
