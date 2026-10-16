import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

import { WantlistItemSchema } from '#/features/wantlist/wantlist.schema'
import type { WantlistItem } from '#/features/wantlist/wantlist.schema'
import {
  buildOAuthHeader,
  DISCOGS_API,
  nonce,
  oauthSignature,
} from '#/shared/utils/discogs-oauth'

import { BarcodeMatchSchema } from './scan.schema'
import type { BarcodeMatch } from './scan.schema'
import type { StackList } from './stack.model'

const discogsSession = async () => {
  const { useAppSession } = await import('#/services/session.server')
  const session = await useAppSession()
  const { accessToken, accessTokenSecret, discogsUsername } = session.data
  if (!accessToken || !accessTokenSecret || !discogsUsername) return null

  const headers = () => ({
    Authorization: buildOAuthHeader({
      oauth_consumer_key: process.env.DISCOGS_CONSUMER_KEY!,
      oauth_token: accessToken,
      oauth_signature_method: 'PLAINTEXT',
      oauth_signature: oauthSignature(
        process.env.DISCOGS_CONSUMER_SECRET!,
        accessTokenSecret,
      ),
      oauth_nonce: nonce(),
      oauth_timestamp: String(Math.floor(Date.now() / 1000)),
    }),
    'User-Agent': 'Sillon/1.0',
  })

  return { username: discogsUsername, headers }
}

const SearchResultsSchema = z.object({
  results: z.array(z.unknown()).default([]),
})

// Every Release a barcode matches: labels reuse barcodes across matches,
// so the first match isn't necessarily the record in hand
export const fetchBarcodeMatches = createServerFn()
  .inputValidator((data: { barcode: string }) => data)
  .handler(async ({ data }): Promise<BarcodeMatch[]> => {
    const discogs = await discogsSession()
    if (!discogs) throw new Error('Not authenticated')

    const params = new URLSearchParams({
      barcode: data.barcode,
      type: 'release',
      per_page: '25',
    })

    const { discogsRequest } = await import('#/services/discogs.server')
    const response = await discogsRequest(
      `${DISCOGS_API}/database/search?${params.toString()}`,
      { headers: discogs.headers() },
    )

    if (!response.ok) {
      throw new Error(`Discogs barcode search failed: ${response.status}`)
    }

    // One odd result mustn't hide the others
    const { results } = SearchResultsSchema.parse(await response.json())
    return results.flatMap((raw) => {
      const parsed = BarcodeMatchSchema.safeParse(raw)
      return parsed.success ? [parsed.data] : []
    })
  })

const AddedCopySchema = z.object({ instance_id: z.number() })

export type StackAddResult =
  | { status: 'added'; instanceId: number }
  | { status: 'wanted'; want: WantlistItem }
  /** Discogs' rate limit: try again in a moment */
  | { status: 'throttled' }

// One record of a Stack added to the Collection or Wantlist. Throttling is a
// result, not an error, so a Stack can pause and carry on
export const addStackRecord = createServerFn({ method: 'POST' })
  .inputValidator((data: { releaseId: number; list: StackList }) => data)
  .handler(async ({ data }): Promise<StackAddResult> => {
    const discogs = await discogsSession()
    if (!discogs) throw new Error('Not authenticated')

    const url =
      data.list === 'collection'
        ? `${DISCOGS_API}/users/${discogs.username}/collection/folders/1/releases/${data.releaseId}`
        : `${DISCOGS_API}/users/${discogs.username}/wants/${data.releaseId}`

    const { discogsRequest } = await import('#/services/discogs.server')
    const response = await discogsRequest(url, {
      method: data.list === 'collection' ? 'POST' : 'PUT',
      headers: { ...discogs.headers(), 'Content-Type': 'application/json' },
    })

    if (response.status === 429) return { status: 'throttled' }
    if (!response.ok) {
      throw new Error(`Failed to add to ${data.list}: ${response.status}`)
    }

    const json: unknown = await response.json()
    if (data.list === 'wantlist') {
      return { status: 'wanted', want: WantlistItemSchema.parse(json) }
    }
    const { instance_id } = AddedCopySchema.parse(json)
    return { status: 'added', instanceId: instance_id }
  })
