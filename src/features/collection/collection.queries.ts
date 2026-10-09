import {
  fetchRandomRecord,
  getCollection,
  getCollectionValue,
} from './collection.api'
import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query'
import type { InfiniteData, QueryClient } from '@tanstack/react-query'
import { getDeezerCover } from '#/services/deezer.api'
import {
  COVER_LOOKUP_VERSION,
  readCachedCover,
  writeCachedCover,
} from '#/shared/utils/cover-cache'
import { recordCredits } from '#/shared/utils/artist-name'
import { releaseCoverKey } from '#/shared/utils/cover-key'
import { preloadCover } from '#/shared/utils/cover-preload'
import { sampleCoverTint } from '#/shared/utils/cover-tint'
import type { ListSort } from '#/shared/utils/list-sort'

import type { CollectionPage, CollectionRelease } from './collection.schema'

// Only changes with the Collection itself — mutations invalidate it
export const collectionValueQueryOptions = (username: string) =>
  queryOptions({
    queryKey: ['collection', username, 'value'] as const,
    queryFn: () => getCollectionValue(),
    staleTime: 60 * 60 * 1000,
  })

const RECENT_ADDITIONS_COUNT = 10

// Over-fetched so removals (patched from cache, see removeCopyFromLists) let
// the next Copy slide in instead of shrinking the list
export const recentAdditionsQueryOptions = queryOptions({
  queryKey: ['collection', { perPage: RECENT_ADDITIONS_COUNT * 2 }],
  queryFn: () =>
    getCollection({
      data: {
        perPage: RECENT_ADDITIONS_COUNT * 2,
        sort: 'added',
        order: 'desc',
      },
    }),
  select: (page): CollectionPage => ({
    ...page,
    releases: page.releases.slice(0, RECENT_ADDITIONS_COUNT),
  }),
  staleTime: 10 * 60 * 1000,
})

// Prefix shared by every sorted list, used for invalidation
export const collectionListQueryKey = ['collection', 'list'] as const

export const collectionQueryOptions = (listSort: ListSort) =>
  infiniteQueryOptions({
    queryKey: [...collectionListQueryKey, { perPage: 20, ...listSort }],
    queryFn: ({ pageParam }) =>
      getCollection({ data: { perPage: 20, page: pageParam, ...listSort } }),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.pagination.page < last.pagination.pages
        ? last.pagination.page + 1
        : undefined,
    staleTime: 10 * 60 * 1000,
    refetchOnMount: false,
  })

// Credits: every artist credited on the record, Lead credit first
export const coverArtQueryOptions = (
  coverKey: string,
  credits: string[],
  title: string,
) =>
  queryOptions({
    queryKey: ['cover', COVER_LOOKUP_VERSION, coverKey],
    queryFn: async () => {
      const cached = readCachedCover(coverKey)
      if (cached !== undefined) return cached
      // Throws when Deezer fails, so only real answers are remembered
      const src = await getDeezerCover({ data: { credits, title } })
      writeCachedCover(coverKey, src)
      return src
    },
    staleTime: Infinity,
    gcTime: Infinity,
    retry: false,
  })

// One tint per Cover, whichever image it was sampled from
export const coverTintQueryOptions = (coverKey: string, src: string | null) =>
  queryOptions({
    queryKey: ['cover-tint', coverKey],
    queryFn: () => (src ? sampleCoverTint(src) : null),
    enabled: !!src,
    staleTime: Infinity,
    gcTime: Infinity,
    retry: false,
  })

interface RandomPickInput {
  /** Record count the client already knows, to skip counting */
  count?: number
  /** The Copy on screen, never drawn twice in a row */
  excludeInstanceId?: number
}

// A Random pick, whole: the Copy, its Cover decoded and its tint sampled, all
// in the caches the record screen reads, so it shows in one go. A failed
// Deezer lookup counts as done: the record gets its House sleeve.
export const prepareRandomPick = async (
  queryClient: QueryClient,
  input: RandomPickInput,
): Promise<CollectionRelease | null> => {
  const record = await fetchRandomRecord({ data: input })
  if (!record) return null

  const { basic_information: info } = record
  const coverKey = releaseCoverKey(record.id, info.master_id)
  const src = await queryClient
    .fetchQuery(
      coverArtQueryOptions(coverKey, recordCredits(info.artists), info.title),
    )
    .catch(() => null)
  if (src && (await preloadCover(src)))
    await queryClient.fetchQuery(coverTintQueryOptions(coverKey, src))

  return record
}

const withoutCopy = (
  page: CollectionPage,
  instanceId: number,
): CollectionPage => ({
  releases: page.releases.filter((r) => r.instance_id !== instanceId),
  pagination: {
    ...page.pagination,
    items: Math.max(0, page.pagination.items - 1),
  },
})

// Discogs reads lag behind writes, so cached lists are patched from the
// mutation result instead of refetched
export function removeCopyFromLists(
  queryClient: QueryClient,
  instanceId: number,
) {
  queryClient.setQueriesData<InfiniteData<CollectionPage, number>>(
    { queryKey: collectionListQueryKey },
    (old) =>
      old
        ? {
            ...old,
            pages: old.pages.map((page) => withoutCopy(page, instanceId)),
          }
        : old,
  )
  queryClient.setQueryData<CollectionPage>(
    recentAdditionsQueryOptions.queryKey,
    (old) => (old ? withoutCopy(old, instanceId) : old),
  )
}
