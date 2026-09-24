import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

import {
  buildOAuthHeader,
  DISCOGS_API,
  nonce,
  oauthSignature,
} from '#/shared/utils/discogs-oauth'

import { listSortSchema, resolveListSort } from '#/shared/utils/list-sort'

import type { WantlistPage } from './wantlist.schema'

export const getWantlist = createServerFn()
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
        wants: [],
        pagination: { page: 1, pages: 1, items: 0 },
      } satisfies WantlistPage
    }

    const consumerKey = process.env.DISCOGS_CONSUMER_KEY!
    const consumerSecret = process.env.DISCOGS_CONSUMER_SECRET!
    const perPage = data.perPage ?? 20
    const page = data.page ?? 1
    const { sort, order } = resolveListSort(data)

    const url = `${DISCOGS_API}/users/${discogsUsername}/wants?sort=${sort}&sort_order=${order}&per_page=${perPage}&page=${page}`

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
      throw new Error(`Discogs wantlist fetch failed: ${response.status}`)
    }

    const json = (await response.json()) as WantlistPage & {
      pagination: { per_page: number }
    }
    return {
      wants: json.wants,
      pagination: {
        page: json.pagination.page,
        pages: json.pagination.pages,
        items: json.pagination.items,
      },
    } satisfies WantlistPage
  })
