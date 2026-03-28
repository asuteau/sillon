import { createServerFn } from '@tanstack/react-start'

export const getSessionUser = createServerFn().handler(async () => {
  if (!process.env.SESSION_SECRET) return null
  const { useAppSession } = await import('./session.server')
  const session = await useAppSession()
  if (!session.data.accessToken) return null
  return {
    username: session.data.discogsUsername!,
    numCollection: session.data.numCollection ?? 0,
    numWantlist: session.data.numWantlist ?? 0,
  }
})
