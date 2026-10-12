import { queryOptions } from '@tanstack/react-query'

import { DISCOGS_MAX_AGE_MS } from '#/shared/utils/discogs-freshness'

import { getMarketplaceStats, getSuggestedPrices } from './marketplace.api'

// Fetched only when a release sheet opens, never from list cards: one Discogs
// call per release would blow the 60 req/min budget while scrolling.
// No retry — a 429 retried makes things worse.
// Login/logout reload the page, so the user's currency can't go stale here.

export const marketplaceStatsQueryOptions = (releaseId: number) =>
  queryOptions({
    queryKey: ['marketplace', releaseId, 'stats'] as const,
    queryFn: () => getMarketplaceStats({ data: { releaseId } }),
    staleTime: 15 * 60 * 1000,
    retry: false,
  })

// Based on sales history, moves slowly: kept as long as Discogs allows
export const suggestedPricesQueryOptions = (releaseId: number) =>
  queryOptions({
    queryKey: ['marketplace', releaseId, 'suggestions'] as const,
    queryFn: () => getSuggestedPrices({ data: { releaseId } }),
    staleTime: DISCOGS_MAX_AGE_MS,
    retry: false,
  })
