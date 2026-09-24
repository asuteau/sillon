import { createServerFn } from '@tanstack/react-start'

import {
  buildOAuthHeader,
  DISCOGS_API,
  nonce,
  oauthSignature,
} from '#/shared/utils/discogs-oauth'

import { toProfile } from './profile.model'
import { DiscogsProfileSchema } from './profile.schema'

export const getProfile = createServerFn().handler(async () => {
  const { useAppSession } = await import('#/services/session.server')
  const session = await useAppSession()
  const { accessToken, accessTokenSecret, discogsUsername } = session.data
  if (!accessToken || !accessTokenSecret || !discogsUsername) return null

  const consumerKey = process.env.DISCOGS_CONSUMER_KEY!
  const consumerSecret = process.env.DISCOGS_CONSUMER_SECRET!
  const url = `${DISCOGS_API}/users/${discogsUsername}`

  const { discogsRequest } = await import('#/services/discogs.server')
  const response = await discogsRequest(url, {
    headers: {
      Authorization: buildOAuthHeader({
        oauth_consumer_key: consumerKey,
        oauth_token: accessToken,
        oauth_signature_method: 'PLAINTEXT',
        oauth_signature: oauthSignature(consumerSecret, accessTokenSecret),
        oauth_nonce: nonce(),
        oauth_timestamp: String(Math.floor(Date.now() / 1000)),
      }),
      'User-Agent': 'Sillon/1.0',
    },
  })

  if (!response.ok) {
    throw new Error(`Discogs profile fetch failed: ${response.status}`)
  }

  return toProfile(DiscogsProfileSchema.parse(await response.json()))
})
