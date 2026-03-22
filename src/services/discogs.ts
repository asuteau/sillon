import { redirect } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

import type { CollectionPage } from '#/features/collection/collection.schema'

const DISCOGS_API = 'https://api.discogs.com'
const DISCOGS_AUTH_URL = 'https://www.discogs.com/oauth/authorize'

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

// ── Auth server functions ──────────────────────────────────────────────────

export const initiateOAuth = createServerFn().handler(async () => {
  const { useAppSession } = await import('./session.server')
  const consumerKey = process.env.DISCOGS_CONSUMER_KEY!
  const consumerSecret = process.env.DISCOGS_CONSUMER_SECRET!
  const callbackUrl = `${process.env.PUBLIC_URL}/auth/callback`

  const response = await fetch(`${DISCOGS_API}/oauth/request_token`, {
    method: 'GET',
    headers: {
      Authorization: buildOAuthHeader({
        oauth_consumer_key: consumerKey,
        oauth_nonce: nonce(),
        oauth_signature: oauthSignature(consumerSecret),
        oauth_signature_method: 'PLAINTEXT',
        oauth_timestamp: String(Math.floor(Date.now() / 1000)),
        oauth_callback: encodeURIComponent(callbackUrl),
      }),
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'Sillon/1.0',
    },
  })

  if (!response.ok) {
    throw new Error(`Discogs request token failed: ${response.status}`)
  }

  const body = await response.text()
  const params = new URLSearchParams(body)
  const token = params.get('oauth_token')!
  const tokenSecret = params.get('oauth_token_secret')!

  const session = await useAppSession()
  await session.update({ requestToken: token, requestTokenSecret: tokenSecret })

  return `${DISCOGS_AUTH_URL}?oauth_token=${token}`
})

export const handleOAuthCallback = createServerFn()
  .inputValidator(
    z.object({ oauth_token: z.string(), oauth_verifier: z.string() }),
  )
  .handler(async ({ data }) => {
    const { useAppSession } = await import('./session.server')
    const consumerKey = process.env.DISCOGS_CONSUMER_KEY!
    const consumerSecret = process.env.DISCOGS_CONSUMER_SECRET!

    const session = await useAppSession()
    const tokenSecret = session.data.requestTokenSecret!

    const response = await fetch(`${DISCOGS_API}/oauth/access_token`, {
      method: 'POST',
      headers: {
        Authorization: buildOAuthHeader({
          oauth_consumer_key: consumerKey,
          oauth_token: data.oauth_token,
          oauth_signature_method: 'PLAINTEXT',
          oauth_signature: oauthSignature(consumerSecret, tokenSecret),
          oauth_nonce: nonce(),
          oauth_timestamp: String(Math.floor(Date.now() / 1000)),
          oauth_verifier: data.oauth_verifier,
        }),
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Sillon/1.0',
      },
    })

    if (!response.ok) {
      throw new Error(`Discogs access token failed: ${response.status}`)
    }

    const body = await response.text()
    const params = new URLSearchParams(body)
    const accessToken = params.get('oauth_token')!
    const accessTokenSecret = params.get('oauth_token_secret')!

    const identityResponse = await fetch(`${DISCOGS_API}/oauth/identity`, {
      headers: {
        Authorization: buildOAuthHeader({
          oauth_consumer_key: consumerKey,
          oauth_token: accessToken,
          oauth_signature_method: 'PLAINTEXT',
          oauth_signature: oauthSignature(consumerSecret, accessTokenSecret),
          oauth_nonce: nonce(),
          oauth_timestamp: String(Math.floor(Date.now() / 1000)),
        }),
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Sillon/1.0',
      },
    })

    if (!identityResponse.ok) {
      throw new Error(`Discogs identity failed: ${identityResponse.status}`)
    }

    const identity = (await identityResponse.json()) as { username: string }

    await session.update({
      accessToken,
      accessTokenSecret,
      discogsUsername: identity.username,
      requestToken: undefined,
      requestTokenSecret: undefined,
    })

    throw redirect({ to: '/' })
  })

export const logoutUser = createServerFn().handler(async () => {
  const { useAppSession } = await import('./session.server')
  const session = await useAppSession()
  await session.clear()
  throw redirect({ to: '/' })
})

// ── Collection server functions ────────────────────────────────────────────

export const getRecentAdditions = createServerFn()
  .inputValidator(
    (data: { perPage?: number; page?: number } | undefined) => data ?? {},
  )
  .handler(async ({ data }) => {
    const { useAppSession } = await import('./session.server')
    const session = await useAppSession()

    const { accessToken, accessTokenSecret, discogsUsername } = session.data
    if (!accessToken || !accessTokenSecret || !discogsUsername) {
      return {
        releases: [],
        pagination: { page: 1, pages: 1, items: 0 },
      } as CollectionPage
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
    } as CollectionPage
  })

export const fetchRandomRecord = createServerFn().handler(async () => {
  const { useAppSession } = await import('./session.server')
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

  const countRes = await fetch(`${base}?per_page=1&page=1`, {
    headers: makeHeaders(),
  })
  if (!countRes.ok)
    throw new Error(`Discogs count fetch failed: ${countRes.status}`)
  const { pagination } = (await countRes.json()) as {
    pagination: { items: number }
  }
  if (pagination.items === 0) return null

  const randomPage = Math.ceil(Math.random() * pagination.items)
  const itemRes = await fetch(`${base}?per_page=1&page=${randomPage}`, {
    headers: makeHeaders(),
  })
  if (!itemRes.ok)
    throw new Error(`Discogs random fetch failed: ${itemRes.status}`)
  const { releases } = (await itemRes.json()) as CollectionPage
  return releases[0] ?? null
})
