import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

import {
  buildOAuthHeader,
  DISCOGS_API,
  nonce,
  oauthSignature,
} from '#/shared/utils/discogs-oauth'

import { toMarketplaceStats, toSuggestedPrices } from './marketplace.model'
import {
  MarketplaceStatsSchema,
  PriceSuggestionsSchema,
} from './marketplace.schema'

const releaseIdSchema = z.object({ releaseId: z.number() })

const signedHeaders = async () => {
  const { useAppSession } = await import('#/services/session.server')
  const session = await useAppSession()
  const { accessToken, accessTokenSecret } = session.data
  if (!accessToken || !accessTokenSecret) return null

  const consumerKey = process.env.DISCOGS_CONSUMER_KEY!
  const consumerSecret = process.env.DISCOGS_CONSUMER_SECRET!
  return {
    Authorization: buildOAuthHeader({
      oauth_consumer_key: consumerKey,
      oauth_token: accessToken,
      oauth_signature_method: 'PLAINTEXT',
      oauth_signature: oauthSignature(consumerSecret, accessTokenSecret),
      oauth_nonce: nonce(),
      oauth_timestamp: String(Math.floor(Date.now() / 1000)),
    }),
    'User-Agent': 'Sillon/1.0',
  }
}

// Prices come in the Discogs currency of the signed-in user
export const getMarketplaceStats = createServerFn()
  .inputValidator(releaseIdSchema)
  .handler(async ({ data }) => {
    const headers = await signedHeaders()
    if (!headers) return null

    const { discogsRequest } = await import('#/services/discogs.server')
    const response = await discogsRequest(
      `${DISCOGS_API}/marketplace/stats/${data.releaseId}`,
      { headers },
    )
    if (!response.ok) {
      throw new Error(`Discogs marketplace stats failed: ${response.status}`)
    }

    return toMarketplaceStats(
      MarketplaceStatsSchema.parse(await response.json()),
    )
  })

// Unavailable (empty) when the user hasn't filled their Discogs seller settings
export const getSuggestedPrices = createServerFn()
  .inputValidator(releaseIdSchema)
  .handler(async ({ data }) => {
    const headers = await signedHeaders()
    if (!headers) return []

    const { discogsRequest } = await import('#/services/discogs.server')
    const response = await discogsRequest(
      `${DISCOGS_API}/marketplace/price_suggestions/${data.releaseId}`,
      { headers },
    )
    if (!response.ok) return []

    const parsed = PriceSuggestionsSchema.safeParse(await response.json())
    return parsed.success ? toSuggestedPrices(parsed.data) : []
  })
