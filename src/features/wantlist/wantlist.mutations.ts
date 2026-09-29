import { createServerFn } from '@tanstack/react-start'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useMatch } from '@tanstack/react-router'

import {
  buildOAuthHeader,
  DISCOGS_API,
  nonce,
  oauthSignature,
} from '#/shared/utils/discogs-oauth'
import { adjustProfileCount } from '#/features/profile/profile.queries'
import { patchBarcodeUserData } from '#/features/search/search.queries'

import { addWantToLists, removeWantFromLists } from './wantlist.queries'
import { WantlistItemSchema } from './wantlist.schema'

export const addToWantlist = createServerFn({ method: 'POST' })
  .inputValidator((data: { releaseId: number }) => data)
  .handler(async ({ data }) => {
    const { useAppSession } = await import('#/services/session.server')
    const session = await useAppSession()

    const { accessToken, accessTokenSecret, discogsUsername } = session.data
    if (!accessToken || !accessTokenSecret || !discogsUsername) {
      throw new Error('Not authenticated')
    }

    const consumerKey = process.env.DISCOGS_CONSUMER_KEY!
    const consumerSecret = process.env.DISCOGS_CONSUMER_SECRET!

    const url = `${DISCOGS_API}/users/${discogsUsername}/wants/${data.releaseId}`

    const response = await fetch(url, {
      method: 'PUT',
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
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to add to wantlist: ${response.status}`)
    }

    return WantlistItemSchema.parse(await response.json())
  })

export const removeFromWantlist = createServerFn({ method: 'POST' })
  .inputValidator((data: { releaseId: number }) => data)
  .handler(async ({ data }) => {
    const { useAppSession } = await import('#/services/session.server')
    const session = await useAppSession()

    const { accessToken, accessTokenSecret, discogsUsername } = session.data
    if (!accessToken || !accessTokenSecret || !discogsUsername) {
      throw new Error('Not authenticated')
    }

    const consumerKey = process.env.DISCOGS_CONSUMER_KEY!
    const consumerSecret = process.env.DISCOGS_CONSUMER_SECRET!

    const url = `${DISCOGS_API}/users/${discogsUsername}/wants/${data.releaseId}`

    const response = await fetch(url, {
      method: 'DELETE',
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
      throw new Error(`Failed to remove from wantlist: ${response.status}`)
    }
  })

export function useAddToWantlist() {
  const queryClient = useQueryClient()
  const user = useMatch({ from: '__root__', select: (m) => m.context.user })

  return useMutation({
    mutationFn: (releaseId: number) => addToWantlist({ data: { releaseId } }),
    onSuccess: (want) => {
      if (user) {
        adjustProfileCount(queryClient, user.username, 'wantlistCount', 1)
      }
      addWantToLists(queryClient, want)
      patchBarcodeUserData(queryClient, want.id, { in_wantlist: true })
    },
  })
}

export function useRemoveFromWantlist() {
  const queryClient = useQueryClient()
  const user = useMatch({ from: '__root__', select: (m) => m.context.user })

  return useMutation({
    mutationFn: (releaseId: number) =>
      removeFromWantlist({ data: { releaseId } }),
    onSuccess: (_, releaseId) => {
      if (user) {
        adjustProfileCount(queryClient, user.username, 'wantlistCount', -1)
      }
      removeWantFromLists(queryClient, releaseId)
      patchBarcodeUserData(queryClient, releaseId, { in_wantlist: false })
    },
  })
}
