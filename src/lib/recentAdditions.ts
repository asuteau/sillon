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

export const getRecentAdditions = createServerFn().handler(async () => {
  const { useAppSession } = await import('./server/session.server')
  const session = await useAppSession()

  const { accessToken, accessTokenSecret, discogsUsername } = session.data
  if (!accessToken || !accessTokenSecret || !discogsUsername) return []

  const consumerKey = process.env.DISCOGS_CONSUMER_KEY!
  const consumerSecret = process.env.DISCOGS_CONSUMER_SECRET!

  const url = `${DISCOGS_API}/users/${discogsUsername}/collection/folders/0/releases?sort=added&sort_order=desc&per_page=10`

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

  const data = (await response.json()) as { releases: CollectionRelease[] }
  return data.releases
})
