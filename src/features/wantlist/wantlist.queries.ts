import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query'

import type { ListSort } from '#/shared/utils/list-sort'

import { fetchWantlistCount, getWantlist } from './wantlist.api'

export const wantlistCountQueryOptions = (username: string) =>
  queryOptions({
    queryKey: ['wantlist', username, 'count'] as const,
    queryFn: () => fetchWantlistCount(),
  })

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
