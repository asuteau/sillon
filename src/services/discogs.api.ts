import { createServerFn } from '@tanstack/react-start'

export const getDiscogsRateLimit = createServerFn().handler(async () => {
  const { getLastRateLimit } = await import('#/services/discogs.server')
  return getLastRateLimit()
})
