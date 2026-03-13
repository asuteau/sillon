import { createServerFn } from '@tanstack/react-start'

export const getSessionUser = createServerFn().handler(async () => {
  if (!process.env.SESSION_SECRET) return null
  // Dynamic import keeps server-only code out of the client bundle
  const { useAppSession } = await import('./server/session.server')
  const session = await useAppSession()
  if (!session.data.accessToken) return null
  return { username: session.data.discogsUsername! }
})
