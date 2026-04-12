import { createServerFn } from '@tanstack/react-start'

import {
  buildOAuthHeader,
  DISCOGS_API,
  nonce,
  oauthSignature,
} from '#/shared/utils/discogs-oauth'

import type { ReleaseDetail, SearchPage, VersionsPage } from './search.schema'
import {
  ReleaseDetailSchema,
  SearchPageSchema,
  VersionsPageSchema,
} from './search.schema'

export const searchMasters = createServerFn()
  .inputValidator(
    (data: { q: string; type?: 'all' | 'artist'; page?: number }) => data,
  )
  .handler(async ({ data }): Promise<SearchPage> => {
    const { useAppSession } = await import('#/services/session.server')
    const session = await useAppSession()

    const { accessToken, accessTokenSecret } = session.data
    if (!accessToken || !accessTokenSecret) {
      return { results: [], pagination: { page: 1, pages: 1, items: 0 } }
    }

    const consumerKey = process.env.DISCOGS_CONSUMER_KEY!
    const consumerSecret = process.env.DISCOGS_CONSUMER_SECRET!
    const page = data.page ?? 1
    const searchType = data.type ?? 'all'

    const params = new URLSearchParams({
      per_page: '50',
      sort: 'year',
      sort_order: 'desc',
      page: String(page),
    })

    params.set('type', 'master')

    if (searchType === 'artist') {
      params.set('artist', data.q)
    } else {
      params.set('q', data.q)
    }

    const url = `${DISCOGS_API}/database/search?${params.toString()}`

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
      throw new Error(`Discogs search failed: ${response.status}`)
    }

    const json = await response.json()
    return SearchPageSchema.parse(json)
  })

export const getMasterVersions = createServerFn()
  .inputValidator((data: { masterId: string; page?: number }) => data)
  .handler(async ({ data }): Promise<VersionsPage> => {
    const { useAppSession } = await import('#/services/session.server')
    const session = await useAppSession()

    const { accessToken, accessTokenSecret } = session.data
    if (!accessToken || !accessTokenSecret) {
      return { versions: [], pagination: { page: 1, pages: 1, items: 0 } }
    }

    const consumerKey = process.env.DISCOGS_CONSUMER_KEY!
    const consumerSecret = process.env.DISCOGS_CONSUMER_SECRET!
    const page = data.page ?? 1

    const url = `${DISCOGS_API}/masters/${data.masterId}/versions?format=Vinyl&per_page=50&sort=released&sort_order=desc&page=${page}`

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
      throw new Error(
        `Discogs master versions fetch failed: ${response.status}`,
      )
    }

    const json = await response.json()
    return VersionsPageSchema.parse(json)
  })

export const getReleaseDetail = createServerFn()
  .inputValidator((data: { releaseId: string }) => data)
  .handler(async ({ data }): Promise<ReleaseDetail> => {
    const { useAppSession } = await import('#/services/session.server')
    const session = await useAppSession()

    const { accessToken, accessTokenSecret } = session.data
    if (!accessToken || !accessTokenSecret) {
      throw new Error('Not authenticated')
    }

    const consumerKey = process.env.DISCOGS_CONSUMER_KEY!
    const consumerSecret = process.env.DISCOGS_CONSUMER_SECRET!

    const url = `${DISCOGS_API}/releases/${data.releaseId}`

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
      throw new Error(`Discogs release fetch failed: ${response.status}`)
    }

    const json = await response.json()
    return ReleaseDetailSchema.parse(json)
  })
