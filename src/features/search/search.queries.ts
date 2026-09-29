import { queryOptions } from '@tanstack/react-query'
import type { QueryClient } from '@tanstack/react-query'

import {
  fetchDiscogsBarcode,
  getArtistDetail,
  getArtistMasterFormats,
  getArtistReleases,
  getMasterVersions,
  getReleaseDetail,
  searchArtists,
  searchMasters,
} from './search.api'
import type { BarcodeResult } from './search.schema'

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

export const artistReleasesQueryOptions = (artistId: string | undefined) =>
  queryOptions({
    queryKey: ['search', 'artistReleases', artistId] as const,
    queryFn: () => getArtistReleases({ data: { artistId: artistId! } }),
    enabled: artistId !== undefined,
    // Up to 10 Discogs requests per artist, and discographies rarely change
    staleTime: 24 * 60 * 60 * 1000,
  })

export const artistMasterFormatsQueryOptions = (artistName: string) =>
  queryOptions({
    queryKey: ['search', 'artistMasterFormats', artistName] as const,
    queryFn: () => getArtistMasterFormats({ data: { artistName } }),
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
