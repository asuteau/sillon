import { createServerFn } from '@tanstack/react-start'

import type { WantlistPage } from './wantlist.schema'

const DISCOGS_API = 'https://api.discogs.com'

function buildOAuthHeader(params: Record<string, string>): string {
  const entries = Object.entries(params)
    .map(([k, v]) => `${k}="${v}"`)
    .join(', ')
  return `OAuth ${entries}`
}

function oauthSignature(consumerSecret: string, tokenSecret = ''): string {
  return `${consumerSecret}&${tokenSecret}`
}

function nonce(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export const getWantlist = createServerFn()
  .inputValidator(
    (data: { perPage?: number; page?: number } | undefined) => data ?? {},
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

    const url = `${DISCOGS_API}/users/${discogsUsername}/wants?sort=added&sort_order=desc&per_page=${perPage}&page=${page}`

    const response = await fetch(url, {
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
