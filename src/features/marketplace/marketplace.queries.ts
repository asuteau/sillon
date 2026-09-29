import { queryOptions } from '@tanstack/react-query'

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

// Based on sales history, moves slowly
export const suggestedPricesQueryOptions = (releaseId: number) =>
  queryOptions({
    queryKey: ['marketplace', releaseId, 'suggestions'] as const,
    queryFn: () => getSuggestedPrices({ data: { releaseId } }),
    staleTime: 24 * 60 * 60 * 1000,
    retry: false,
  })
