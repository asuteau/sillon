import { createServerFn } from '@tanstack/react-start'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useMatch } from '@tanstack/react-router'

import {
  buildOAuthHeader,
  DISCOGS_API,
  nonce,
  oauthSignature,
} from '#/shared/utils/discogs-oauth'
import {
  collectionCountQueryOptions,
  collectionListQueryKey,
  recentAdditionsQueryOptions,
} from './collection.queries'

export const addToCollection = createServerFn()
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

    const url = `${DISCOGS_API}/users/${discogsUsername}/collection/folders/1/releases/${data.releaseId}`

    const response = await fetch(url, {
      method: 'POST',
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
      throw new Error(`Failed to add to collection: ${response.status}`)
    }

    const json = (await response.json()) as { instance_id: number }
    return { instanceId: json.instance_id }
  })

export const removeFromCollection = createServerFn()
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

    // Resolve the instance_id from the collection releases endpoint
    const instancesRes = await fetch(
      `${DISCOGS_API}/users/${discogsUsername}/collection/releases/${data.releaseId}`,
      { headers: makeHeaders() },
    )
    if (!instancesRes.ok) {
      throw new Error(
        `Failed to fetch collection instances: ${instancesRes.status}`,
      )
    }
    const instancesJson = (await instancesRes.json()) as {
      releases: Array<{ instance_id: number; folder_id: number }>
    }
    const { instance_id, folder_id } = instancesJson.releases[0]

    const deleteRes = await fetch(
      `${DISCOGS_API}/users/${discogsUsername}/collection/folders/${folder_id}/releases/${data.releaseId}/instances/${instance_id}`,
      { method: 'DELETE', headers: makeHeaders() },
    )

    if (!deleteRes.ok) {
      throw new Error(`Failed to remove from collection: ${deleteRes.status}`)
    }
  })

export function useAddToCollection() {
  const queryClient = useQueryClient()
  const user = useMatch({ from: '__root__', select: (m) => m.context.user })

  return useMutation({
    mutationFn: (releaseId: number) => addToCollection({ data: { releaseId } }),
    onSuccess: () => {
      if (user) {
        queryClient.setQueryData(
          collectionCountQueryOptions(user.username).queryKey,
          (old: number | undefined) => (old ?? 0) + 1,
        )
      }
      queryClient.invalidateQueries({
        queryKey: collectionListQueryKey,
      })
      queryClient.invalidateQueries({
        queryKey: recentAdditionsQueryOptions.queryKey,
      })
    },
  })
}

export function useRemoveFromCollection() {
  const queryClient = useQueryClient()
  const user = useMatch({ from: '__root__', select: (m) => m.context.user })

  return useMutation({
    mutationFn: (releaseId: number) =>
      removeFromCollection({ data: { releaseId } }),
    onSuccess: () => {
      if (user) {
        queryClient.setQueryData(
          collectionCountQueryOptions(user.username).queryKey,
          (old: number | undefined) => Math.max(0, (old ?? 0) - 1),
        )
      }
      queryClient.invalidateQueries({
        queryKey: collectionListQueryKey,
      })
      queryClient.invalidateQueries({
        queryKey: recentAdditionsQueryOptions.queryKey,
      })
    },
  })
}
