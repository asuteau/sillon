import {
  fetchRandomRecord,
  getRecentAdditions,
} from '#/services/discogs'
import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query'

export const recentAdditionsQueryOptions = queryOptions({
  queryKey: ['collection', { perPage: 10 }],
  queryFn: () => getRecentAdditions({ data: { perPage: 10 } }),
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
})

export const randomRecordQueryOptions = queryOptions({
  queryKey: ['collection', 'random'],
  queryFn: () => fetchRandomRecord(),
  staleTime: 0,
  gcTime: 0,
  enabled: false,
})
