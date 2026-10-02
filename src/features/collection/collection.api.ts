import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

import {
  buildOAuthHeader,
  DISCOGS_API,
  nonce,
  oauthSignature,
} from '#/shared/utils/discogs-oauth'

import { listSortSchema, resolveListSort } from '#/shared/utils/list-sort'

import { toEstimatedValue } from './collection.model'
import type { CollectionPage } from './collection.schema'
import { CollectionValueSchema } from './collection.schema'

export const getCollection = createServerFn()
  .inputValidator(
    listSortSchema
      .extend({
        perPage: z.number().int().positive().optional(),
        page: z.number().int().positive().optional(),
      })
      .optional()
      .default({}),
  )
  .handler(async ({ data }) => {
    const { useAppSession } = await import('#/services/session.server')
    const session = await useAppSession()

    const { accessToken, accessTokenSecret, discogsUsername } = session.data
    if (!accessToken || !accessTokenSecret || !discogsUsername) {
      return {
        releases: [],
        pagination: { page: 1, pages: 1, items: 0 },
      }
    }

    const consumerKey = process.env.DISCOGS_CONSUMER_KEY!
    const consumerSecret = process.env.DISCOGS_CONSUMER_SECRET!
    const perPage = data.perPage ?? 10
    const page = data.page ?? 1
    const { sort, order } = resolveListSort(data)

    const url = `${DISCOGS_API}/users/${discogsUsername}/collection/folders/0/releases?sort=${sort}&sort_order=${order}&per_page=${perPage}&page=${page}`

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
      throw new Error(`Discogs collection fetch failed: ${response.status}`)
    }

    const json = (await response.json()) as CollectionPage & {
      pagination: { per_page: number }
    }
    return {
      releases: json.releases,
      pagination: {
        page: json.pagination.page,
        pages: json.pagination.pages,
        items: json.pagination.items,
      },
    }
  })

export const fetchRandomRecord = createServerFn().handler(async () => {
  const { useAppSession } = await import('#/services/session.server')
  const session = await useAppSession()

  const { accessToken, accessTokenSecret, discogsUsername } = session.data
  if (!accessToken || !accessTokenSecret || !discogsUsername) return null

  const consumerKey = process.env.DISCOGS_CONSUMER_KEY!
  const consumerSecret = process.env.DISCOGS_CONSUMER_SECRET!
  const base = `${DISCOGS_API}/users/${discogsUsername}/collection/folders/0/releases`

  function makeHeaders() {
    return {
      Authorization: buildOAuthHeader({
        oauth_consumer_key: consumerKey,
        oauth_token: accessToken!,
        oauth_signature_method: 'PLAINTEXT',
        oauth_signature: oauthSignature(consumerSecret, accessTokenSecret),
        oauth_nonce: nonce(),
        oauth_timestamp: String(Math.floor(Date.now() / 1000)),
      }),
      'User-Agent': 'Sillon/1.0',
    }
  }

  const { discogsRequest } = await import('#/services/discogs.server')
  const countRes = await discogsRequest(`${base}?per_page=1&page=1`, {
    headers: makeHeaders(),
  })
  if (!countRes.ok)
    throw new Error(`Discogs count fetch failed: ${countRes.status}`)
  const { pagination } = (await countRes.json()) as {
    pagination: { items: number }
  }
  if (pagination.items === 0) return null

  const randomPage = Math.ceil(Math.random() * pagination.items)
  const itemRes = await discogsRequest(
    `${base}?per_page=1&page=${randomPage}`,
    {
      headers: makeHeaders(),
    },
  )
  if (!itemRes.ok)
    throw new Error(`Discogs random fetch failed: ${itemRes.status}`)
  const { releases } = (await itemRes.json()) as CollectionPage
  return releases[0] ?? null
})

export const getCollectionValue = createServerFn().handler(async () => {
  const { useAppSession } = await import('#/services/session.server')
  const session = await useAppSession()
  const { accessToken, accessTokenSecret, discogsUsername } = session.data
  if (!accessToken || !accessTokenSecret || !discogsUsername) return null

  const consumerKey = process.env.DISCOGS_CONSUMER_KEY!
  const consumerSecret = process.env.DISCOGS_CONSUMER_SECRET!
  const url = `${DISCOGS_API}/users/${discogsUsername}/collection/value`

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
    throw new Error(`Discogs collection value fetch failed: ${response.status}`)
  }

  return toEstimatedValue(CollectionValueSchema.parse(await response.json()))
})
