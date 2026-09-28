import { queryOptions } from '@tanstack/react-query'

import { getSessionUser } from '#/services/session'

// Login and logout both go through full page loads, so a signed-in user is
// cached for the app's lifetime; a signed-out result is always rechecked.
export const sessionUserQueryOptions = queryOptions({
  queryKey: ['session', 'user'],
  queryFn: () => getSessionUser(),
  staleTime: (query) => (query.state.data ? Infinity : 0),
  gcTime: Infinity,
})
