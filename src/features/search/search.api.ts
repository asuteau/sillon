import { createServerFn } from '@tanstack/react-start'

import {
  buildOAuthHeader,
  DISCOGS_API,
  nonce,
  oauthSignature,
} from '#/shared/utils/discogs-oauth'

import type {
  ArtistDetail,
  ArtistDiscography,
  ArtistRelease,
  ArtistSearchPage,
  BarcodeResult,
  MasterFormats,
  ReleaseDetail,
  SearchPage,
  VersionsPage,
} from './search.schema'
import {
  ArtistDetailSchema,
  ArtistReleasesPageSchema,
  ArtistSearchPageSchema,
  BarcodeResultSchema,
  PaginatedSchema,
  ReleaseDetailSchema,
  SearchPageSchema,
  VersionsPageSchema,
} from './search.schema'

type DiscogsTokens = { accessToken: string; accessTokenSecret: string }

// Caps a paginated fetch so prolific artists stay within the Discogs rate limit
const MAX_PAGES = 10

async function discogsGet(
  url: string,
  { accessToken, accessTokenSecret }: DiscogsTokens,
  label: string,
): Promise<unknown> {
  const { discogsRequest } = await import('#/services/discogs.server')
  const response = await discogsRequest(url, {
    headers: {
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
    },
  })

  if (!response.ok) {
    throw new Error(`${label} failed: ${response.status}`)
  }

  return response.json()
}

function keepMainMasters(releases: ArtistRelease[]): ArtistRelease[] {
  return releases.filter((r) => r.type === 'master' && r.role === 'Main')
}

async function discogsGetAllPages(
  urlForPage: (page: number) => string,
  tokens: DiscogsTokens,
  label: string,
): Promise<{ pages: unknown[]; truncated: boolean }> {
  const first = await discogsGet(urlForPage(1), tokens, label)
  const total = PaginatedSchema.parse(first).pagination.pages
  const last = Math.min(total, MAX_PAGES)

  const rest = await Promise.all(
    Array.from({ length: last - 1 }, (_, i) =>
      discogsGet(urlForPage(i + 2), tokens, label),
    ),
  )

  return { pages: [first, ...rest], truncated: total > MAX_PAGES }
}

export const searchMasters = createServerFn()
  .inputValidator((data: { q: string; page?: number }) => data)
  .handler(async ({ data }): Promise<SearchPage> => {
    const { useAppSession } = await import('#/services/session.server')
    const session = await useAppSession()

    const { accessToken, accessTokenSecret } = session.data
    if (!accessToken || !accessTokenSecret) {
      return { results: [], pagination: { page: 1, pages: 1, items: 0 } }
    }

    // No sort: Discogs ranks by relevance, so a more precise query surfaces the right master
    const params = new URLSearchParams({
      q: data.q,
      type: 'master',
      per_page: '50',
      page: String(data.page ?? 1),
    })

    const json = await discogsGet(
      `${DISCOGS_API}/database/search?${params.toString()}`,
      { accessToken, accessTokenSecret },
      'Discogs search',
    )
    return SearchPageSchema.parse(json)
  })

export const getMasterVersions = createServerFn()
  .inputValidator((data: { masterId: string; page?: number }) => data)
  .handler(async ({ data }): Promise<VersionsPage> => {
    const { useAppSession } = await import('#/services/session.server')
    const session = await useAppSession()

    const { accessToken, accessTokenSecret } = session.data
    if (!accessToken || !accessTokenSecret) {
      return { versions: [], pagination: { page: 1, pages: 1, items: 0 } }
    }

    const consumerKey = process.env.DISCOGS_CONSUMER_KEY!
    const consumerSecret = process.env.DISCOGS_CONSUMER_SECRET!
    const page = data.page ?? 1

    const url = `${DISCOGS_API}/masters/${data.masterId}/versions?format=Vinyl&per_page=50&sort=released&sort_order=desc&page=${page}`

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
      throw new Error(
        `Discogs master versions fetch failed: ${response.status}`,
      )
    }

    const json = await response.json()
    return VersionsPageSchema.parse(json)
  })

export const getReleaseDetail = createServerFn()
  .inputValidator((data: { releaseId: string }) => data)
  .handler(async ({ data }): Promise<ReleaseDetail> => {
    const { useAppSession } = await import('#/services/session.server')
    const session = await useAppSession()

    const { accessToken, accessTokenSecret } = session.data
    if (!accessToken || !accessTokenSecret) {
      throw new Error('Not authenticated')
    }

    const consumerKey = process.env.DISCOGS_CONSUMER_KEY!
    const consumerSecret = process.env.DISCOGS_CONSUMER_SECRET!

    const url = `${DISCOGS_API}/releases/${data.releaseId}`

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
      throw new Error(`Discogs release fetch failed: ${response.status}`)
    }

    const json = await response.json()
    return ReleaseDetailSchema.parse(json)
  })

export const searchArtists = createServerFn()
  .inputValidator((data: { q: string }) => data)
  .handler(async ({ data }): Promise<ArtistSearchPage> => {
    const { useAppSession } = await import('#/services/session.server')
    const session = await useAppSession()

    const { accessToken, accessTokenSecret } = session.data
    if (!accessToken || !accessTokenSecret) {
      return { results: [], pagination: { page: 1, pages: 1, items: 0 } }
    }

    const consumerKey = process.env.DISCOGS_CONSUMER_KEY!
    const consumerSecret = process.env.DISCOGS_CONSUMER_SECRET!

    const params = new URLSearchParams({
      q: data.q,
      type: 'artist',
      per_page: '25',
    })

    const url = `${DISCOGS_API}/database/search?${params.toString()}`

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
      throw new Error(`Discogs artist search failed: ${response.status}`)
    }

    const json = await response.json()
    return ArtistSearchPageSchema.parse(json)
  })

export const getArtistDetail = createServerFn()
  .inputValidator((data: { artistId: string }) => data)
  .handler(async ({ data }): Promise<ArtistDetail> => {
    const { useAppSession } = await import('#/services/session.server')
    const session = await useAppSession()

    const { accessToken, accessTokenSecret } = session.data
    if (!accessToken || !accessTokenSecret) {
      throw new Error('Not authenticated')
    }

    const consumerKey = process.env.DISCOGS_CONSUMER_KEY!
    const consumerSecret = process.env.DISCOGS_CONSUMER_SECRET!

    const url = `${DISCOGS_API}/artists/${data.artistId}`

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
      throw new Error(`Discogs artist detail fetch failed: ${response.status}`)
    }

    const json = await response.json()
    return ArtistDetailSchema.parse(json)
  })

export const getArtistReleases = createServerFn()
  .inputValidator((data: { artistId: string }) => data)
  .handler(async ({ data }): Promise<ArtistDiscography> => {
    const { useAppSession } = await import('#/services/session.server')
    const session = await useAppSession()

    const { accessToken, accessTokenSecret } = session.data
    if (!accessToken || !accessTokenSecret) {
      return { releases: [], truncated: false }
    }

    // Discogs lists Main releases first, then appearances, so paging stops once they run out
    const releases: ArtistRelease[] = []
    for (let page = 1; page <= MAX_PAGES; page++) {
      const json = await discogsGet(
        `${DISCOGS_API}/artists/${data.artistId}/releases?sort=year&sort_order=desc&per_page=100&page=${page}`,
        { accessToken, accessTokenSecret },
        'Discogs artist releases fetch',
      )
      const parsed = ArtistReleasesPageSchema.parse(json)
      releases.push(...parsed.releases)

      const isLastPage = page >= parsed.pagination.pages
      const mainEnded = parsed.releases.some((r) => r.role !== 'Main')
      if (isLastPage || mainEnded) {
        return { releases: keepMainMasters(releases), truncated: false }
      }
    }

    return { releases: keepMainMasters(releases), truncated: true }
  })

// Artist releases carry no format tags, so they are looked up via search and joined by master ID
export const getArtistMasterFormats = createServerFn()
  .inputValidator((data: { artistName: string }) => data)
  .handler(async ({ data }): Promise<MasterFormats[]> => {
    const { useAppSession } = await import('#/services/session.server')
    const session = await useAppSession()

    const { accessToken, accessTokenSecret } = session.data
    if (!accessToken || !accessTokenSecret) return []

    const params = new URLSearchParams({
      artist: data.artistName,
      type: 'master',
      per_page: '100',
    })

    const { pages } = await discogsGetAllPages(
      (page) =>
        `${DISCOGS_API}/database/search?${params.toString()}&page=${page}`,
      { accessToken, accessTokenSecret },
      'Discogs artist formats search',
    )

    return pages
      .flatMap((json) => SearchPageSchema.parse(json).results)
      .map((r) => ({ id: r.id, formats: r.format ?? [] }))
  })

export const fetchDiscogsBarcode = createServerFn()
  .inputValidator((data: { barcode: string }) => data)
  .handler(async ({ data }): Promise<BarcodeResult | null> => {
    const { useAppSession } = await import('#/services/session.server')
    const session = await useAppSession()

    const { accessToken, accessTokenSecret } = session.data
    if (!accessToken || !accessTokenSecret) {
      return null
    }

    const consumerKey = process.env.DISCOGS_CONSUMER_KEY!
    const consumerSecret = process.env.DISCOGS_CONSUMER_SECRET!

    const params = new URLSearchParams({
      barcode: data.barcode,
      type: 'release',
      per_page: '5',
    })

    const url = `${DISCOGS_API}/database/search?${params.toString()}`

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
      throw new Error(`Discogs barcode search failed: ${response.status}`)
    }

    const json = await response.json()
    const parsed = BarcodeResultSchema.array().safeParse(
      (json as { results?: unknown }).results ?? [],
    )
    const results = parsed.success ? parsed.data : []
    return results[0] ?? null
  })
