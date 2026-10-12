import {
  fetchRandomRecord,
  getCollection,
  getCollectionValue,
} from './collection.api'
import {
  hashKey,
  infiniteQueryOptions,
  queryOptions,
} from '@tanstack/react-query'
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

import { collectionPersistence } from './collection.persist'
import type { CollectionPage, CollectionRelease } from './collection.schema'

// Only changes with the Collection itself — mutations invalidate it
export const collectionValueQueryOptions = (username: string) =>
  queryOptions({
    queryKey: ['collection', username, 'value'] as const,
    queryFn: () => getCollectionValue(),
    staleTime: 60 * 60 * 1000,
  })

// Prefix shared by every sorted list, used for invalidation
export const collectionListQueryKey = ['collection', 'list'] as const

// Discogs' largest page: fewest requests to read the whole Collection
const COLLECTION_PER_PAGE = 100

/** A page stamped with when it was asked of Discogs, to tell its age */
export type CollectionListPage = CollectionPage & { fetchedAt: number }

// The newest-first list is the one Collection cache, persisted on device
export const isPersistedListSort = ({ sort, order }: ListSort) =>
  sort === 'added' && order === 'desc'

export const collectionQueryOptions = (listSort: ListSort) =>
  infiniteQueryOptions({
    queryKey: [
      ...collectionListQueryKey,
      { perPage: COLLECTION_PER_PAGE, ...listSort },
    ],
    queryFn: async ({ pageParam }): Promise<CollectionListPage> => {
      const fetchedAt = Date.now()
      const page = await getCollection({
        data: { perPage: COLLECTION_PER_PAGE, page: pageParam, ...listSort },
      })
      return { ...page, fetchedAt }
    },
    persister: isPersistedListSort(listSort)
      ? collectionPersistence.persister
      : undefined,
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.pagination.page < last.pagination.pages
        ? last.pagination.page + 1
        : undefined,
    staleTime: 10 * 60 * 1000,
    refetchOnMount: false,
  })

type CollectionPages = InfiniteData<CollectionListPage, number>

const newestFirstQueryOptions = collectionQueryOptions({
  sort: 'added',
  order: 'desc',
})

const RECENT_ADDITIONS_COUNT = 10

// The first page of the newest-first Collection list: both share one cache,
// and its 100 Copies let the next one slide in on removal
export const recentAdditionsQueryOptions = infiniteQueryOptions({
  ...newestFirstQueryOptions,
  select: (data): CollectionPage => ({
    releases: data.pages[0].releases.slice(0, RECENT_ADDITIONS_COUNT),
    pagination: data.pages[0].pagination,
  }),
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

const adjustItems = (
  page: CollectionListPage,
  delta: 1 | -1,
): CollectionListPage => ({
  ...page,
  pagination: {
    ...page.pagination,
    items: Math.max(0, page.pagination.items + delta),
  },
})

// Discogs reads lag behind writes, so cached lists are patched from the
// mutation result instead of refetched
export function addCopyToLists(
  queryClient: QueryClient,
  copy: CollectionRelease,
) {
  const isCopy = (r: CollectionRelease) => r.instance_id === copy.instance_id

  queryClient.setQueryData<CollectionPages>(
    newestFirstQueryOptions.queryKey,
    (old) => {
      if (!old || old.pages.some((page) => page.releases.some(isCopy)))
        return old
      // Each page's last Copy moves onto the next, as Discogs' pages will,
      // so the next page fetched starts where the last loaded one ends
      let carried = copy
      return {
        ...old,
        pages: old.pages.map((page, index) => {
          const releases = [carried, ...page.releases]
          const isLastLoaded = index === old.pages.length - 1
          const hasNext = page.pagination.page < page.pagination.pages
          if (!isLastLoaded || hasNext) carried = releases.pop()!
          return adjustItems({ ...page, releases }, 1)
        }),
      }
    },
  )
  // Other sorts can't place the new Copy: refetch them on next visit only
  queryClient.invalidateQueries({
    queryKey: collectionListQueryKey,
    predicate: (query) =>
      query.queryHash !== hashKey(newestFirstQueryOptions.queryKey),
    refetchType: 'none',
  })
}

export function removeCopyFromLists(
  queryClient: QueryClient,
  instanceId: number,
) {
  queryClient.setQueriesData<CollectionPages>(
    { queryKey: collectionListQueryKey },
    (old) =>
      old
        ? {
            ...old,
            pages: old.pages.map((page) =>
              adjustItems(
                {
                  ...page,
                  releases: page.releases.filter(
                    (r) => r.instance_id !== instanceId,
                  ),
                },
                -1,
              ),
            ),
          }
        : old,
  )
}
