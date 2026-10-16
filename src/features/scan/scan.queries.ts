import { queryOptions } from '@tanstack/react-query'
import type { QueryClient } from '@tanstack/react-query'

import { getCollection } from '#/features/collection/collection.api'
import {
  addCopyToLists,
  collectionListQueryKey,
  collectionValueQueryOptions,
} from '#/features/collection/collection.queries'
import { adjustProfileCount } from '#/features/profile/profile.queries'
import { addWantToLists } from '#/features/wantlist/wantlist.queries'
import { DISCOGS_MAX_AGE_MS } from '#/shared/utils/discogs-freshness'

import { fetchBarcodeMatches } from './scan.api'
import type { StackAddResult } from './scan.api'
import type { BarcodeMatch } from './scan.schema'

export const barcodeMatchesQueryOptions = (barcode: string) =>
  queryOptions({
    queryKey: ['scan', 'barcode', barcode] as const,
    queryFn: () => fetchBarcodeMatches({ data: { barcode } }),
    staleTime: DISCOGS_MAX_AGE_MS,
  })

// Barcode matches stay fresh for hours, so list changes must be patched into them
export const patchBarcodeUserData = (
  queryClient: QueryClient,
  releaseId: number,
  patch: Partial<NonNullable<BarcodeMatch['user_data']>>,
) => {
  queryClient.setQueriesData<BarcodeMatch[]>(
    { queryKey: ['scan', 'barcode'] },
    (old) =>
      old?.map((match) =>
        match.id === releaseId && match.user_data
          ? { ...match, user_data: { ...match.user_data, ...patch } }
          : match,
      ),
  )
}

// A confirmed Stack, into the cached lists and counts at once. Discogs reads
// lag behind writes, so lists are patched rather than refetched: one read of
// the newest Copies gives them all
export const patchListsAfterStack = async (
  queryClient: QueryClient,
  username: string | undefined,
  results: StackAddResult[],
) => {
  const instanceIds = new Set<number>()

  for (const result of results) {
    if (result.status === 'wanted') {
      addWantToLists(queryClient, result.want)
      patchBarcodeUserData(queryClient, result.want.id, { in_wantlist: true })
      if (username)
        adjustProfileCount(queryClient, username, 'wantlistCount', 1)
    }
    if (result.status === 'added') {
      instanceIds.add(result.instanceId)
      if (username) adjustProfileCount(queryClient, username, 'recordCount', 1)
    }
  }

  if (instanceIds.size === 0) return
  if (username) {
    void queryClient.invalidateQueries({
      queryKey: collectionValueQueryOptions(username).queryKey,
    })
  }

  const newest = await getCollection({
    data: { perPage: instanceIds.size, sort: 'added', order: 'desc' },
  }).catch(() => null)
  const copies = (newest?.releases ?? []).filter((copy) =>
    instanceIds.has(copy.instance_id),
  )
  // Oldest first, so the newest lands on top
  for (const copy of [...copies].reverse()) {
    patchBarcodeUserData(queryClient, copy.id, { in_collection: true })
    addCopyToLists(queryClient, copy)
  }
  // The read lagged behind some adds: the lists refetch on next visit
  if (copies.length < instanceIds.size) {
    void queryClient.invalidateQueries({
      queryKey: collectionListQueryKey,
      refetchType: 'none',
    })
  }
}
