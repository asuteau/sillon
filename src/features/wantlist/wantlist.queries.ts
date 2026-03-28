import { createServerFn } from '@tanstack/react-start'
import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query'

import { getWantlist } from './wantlist.api'

const getWantlistCount = createServerFn().handler(async () => {
  const { useAppSession } = await import('#/services/session.server')
  const session = await useAppSession()
  return session.data.numWantlist ?? 0
})

export const wantlistCountQueryOptions = (username: string) =>
  queryOptions({
    queryKey: ['wantlist', username, 'count'] as const,
    queryFn: () => getWantlistCount(),
    staleTime: Infinity,
  })

export const wantlistQueryOptions = infiniteQueryOptions({
  queryKey: ['wantlist', { perPage: 20 }],
  queryFn: ({ pageParam }) =>
    getWantlist({ data: { perPage: 20, page: pageParam } }),
  initialPageParam: 1,
  getNextPageParam: (last) =>
    last.pagination.page < last.pagination.pages
      ? last.pagination.page + 1
      : undefined,
  staleTime: 10 * 60 * 1000,
  refetchOnMount: false,
})
