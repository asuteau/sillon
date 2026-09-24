import type { QueryClient } from '@tanstack/react-query'
import { queryOptions } from '@tanstack/react-query'

import { getProfile } from './profile.api'
import type { Profile } from './profile.model'

export const profileQueryOptions = (username: string) =>
  queryOptions({
    queryKey: ['profile', username] as const,
    queryFn: () => getProfile(),
    staleTime: 10 * 60 * 1000,
  })

// Patches a Record count in the cached profile after a successful mutation
export function adjustProfileCount(
  queryClient: QueryClient,
  username: string,
  count: 'recordCount' | 'wantlistCount',
  delta: 1 | -1,
) {
  queryClient.setQueryData(
    profileQueryOptions(username).queryKey,
    (old: Profile | null | undefined) =>
      old ? { ...old, [count]: Math.max(0, old[count] + delta) } : old,
  )
}
