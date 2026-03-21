import { createServerFn } from '@tanstack/react-start'

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

export type CollectionRelease = {
  id: number
  instance_id: number
  date_added: string
  basic_information: {
    title: string
    year: number
    artists: Array<{ name: string }>
    cover_image: string
    thumb: string
  }
}

export type CollectionPage = {
  releases: CollectionRelease[]
  pagination: { page: number; pages: number; items: number }
}

export const getRecentAdditions = createServerFn()
  .inputValidator((data: { perPage?: number; page?: number } | undefined) => data ?? {})
  .handler(async ({ data }) => {
  const { useAppSession } = await import('./server/session.server')
  const session = await useAppSession()

  const { accessToken, accessTokenSecret, discogsUsername } = session.data
  if (!accessToken || !accessTokenSecret || !discogsUsername) {
    return { releases: [], pagination: { page: 1, pages: 1, items: 0 } } as CollectionPage
  }

  const consumerKey = process.env.DISCOGS_CONSUMER_KEY!
  const consumerSecret = process.env.DISCOGS_CONSUMER_SECRET!
  const perPage = data.perPage ?? 10
  const page = data.page ?? 1

  const url = `${DISCOGS_API}/users/${discogsUsername}/collection/folders/0/releases?sort=added&sort_order=desc&per_page=${perPage}&page=${page}`

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
    throw new Error(`Discogs collection fetch failed: ${response.status}`)
  }

  const json = (await response.json()) as {
    releases: CollectionRelease[]
    pagination: { page: number; pages: number; items: number; per_page: number }
  }
  return {
    releases: json.releases,
    pagination: {
      page: json.pagination.page,
      pages: json.pagination.pages,
      items: json.pagination.items,
    },
  } as CollectionPage
})
