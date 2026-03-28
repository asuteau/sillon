import { useSession } from '@tanstack/react-start/server'

export type SessionData = {
  requestToken?: string
  requestTokenSecret?: string
  accessToken?: string
  accessTokenSecret?: string
  discogsUsername?: string
  numCollection?: number
  numWantlist?: number
  currency?: string
  country?: string
}

export const useAppSession = () =>
  useSession<SessionData>({
    password: process.env.SESSION_SECRET!,
    maxAge: 60 * 60 * 24 * 30, // 30 days
  })
