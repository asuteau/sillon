import { infiniteQueryOptions } from '@tanstack/react-query'

import { getWantlist } from './wantlist.api'

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
