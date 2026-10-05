import { queryOptions } from '@tanstack/react-query'
import type { QueryClient } from '@tanstack/react-query'

import {
  fetchDiscogsBarcode,
  getArtistDetail,
  getArtistMasters,
  getMasterVersions,
  getReleaseDetail,
  searchArtists,
  searchMasters,
} from './search.api'
import type { BarcodeResult, DiscographyFormat } from './search.schema'

export const mastersQueryOptions = (q: string) =>
  queryOptions({
    queryKey: ['search', 'masters', q] as const,
    queryFn: () => searchMasters({ data: { q } }),
    enabled: q.length > 2,
    staleTime: 5 * 60 * 1000,
  })

export const versionsQueryOptions = (masterId: string | undefined) =>
  queryOptions({
    queryKey: ['search', 'versions', masterId] as const,
    queryFn: () => getMasterVersions({ data: { masterId: masterId! } }),
    enabled: masterId !== undefined,
    staleTime: 5 * 60 * 1000,
  })

export const releaseDetailQueryOptions = (releaseId: string) =>
  queryOptions({
    queryKey: ['search', 'release', releaseId] as const,
    queryFn: () => getReleaseDetail({ data: { releaseId } }),
    staleTime: 30 * 60 * 1000,
  })

export const artistsQueryOptions = (q: string) =>
  queryOptions({
    queryKey: ['search', 'artists', q] as const,
    queryFn: () => searchArtists({ data: { q } }),
    enabled: q.length > 2,
    staleTime: 5 * 60 * 1000,
  })

export const artistMastersQueryOptions = (
  artistName: string,
  format: DiscographyFormat | null,
  enabled = true,
) =>
  queryOptions({
    queryKey: ['search', 'artistMasters', artistName, format] as const,
    queryFn: () => getArtistMasters({ data: { artistName, format } }),
    enabled,
    // Up to 10 Discogs requests per artist, and discographies rarely change
    staleTime: 24 * 60 * 60 * 1000,
  })

export const artistDetailQueryOptions = (artistId: string) =>
  queryOptions({
    queryKey: ['search', 'artistDetail', artistId] as const,
    queryFn: () => getArtistDetail({ data: { artistId } }),
    staleTime: 30 * 60 * 1000,
  })

export const barcodeSearchQueryOptions = (barcode: string) =>
  queryOptions({
    queryKey: ['search', 'barcode', barcode] as const,
    queryFn: () => fetchDiscogsBarcode({ data: { barcode } }),
    staleTime: Infinity,
    enabled: barcode.length > 0,
  })

// Barcode results never go stale, so list changes must be patched into them
export const patchBarcodeUserData = (
  queryClient: QueryClient,
  releaseId: number,
  patch: Partial<NonNullable<BarcodeResult['user_data']>>,
) => {
  queryClient.setQueriesData<BarcodeResult | null>(
    { queryKey: ['search', 'barcode'] },
    (old) =>
      old?.id === releaseId && old.user_data
        ? { ...old, user_data: { ...old.user_data, ...patch } }
        : old,
  )
}
