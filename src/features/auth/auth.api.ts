import { redirect } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

import {
  buildOAuthHeader,
  DISCOGS_API,
  nonce,
  oauthSignature,
} from '#/shared/utils/discogs-oauth'

const DISCOGS_AUTH_URL = 'https://www.discogs.com/oauth/authorize'

export const initiateOAuth = createServerFn().handler(async () => {
  const { useAppSession } = await import('#/services/session.server')
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
    const { useAppSession } = await import('#/services/session.server')
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
  const { useAppSession } = await import('#/services/session.server')
  const session = await useAppSession()
  await session.clear()
  throw redirect({ to: '/' })
})
