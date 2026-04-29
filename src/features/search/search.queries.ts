import { queryOptions } from '@tanstack/react-query'

import {
  fetchDiscogsBarcode,
  getMasterVersions,
  getReleaseDetail,
  searchMasters,
} from './search.api'

export const mastersQueryOptions = (
  q: string,
  type: 'all' | 'artist' = 'all',
) =>
  queryOptions({
    queryKey: ['search', 'masters', q, type] as const,
    queryFn: () => searchMasters({ data: { q, type } }),
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

export const barcodeSearchQueryOptions = (barcode: string) =>
  queryOptions({
    queryKey: ['search', 'barcode', barcode] as const,
    queryFn: () => fetchDiscogsBarcode({ data: { barcode } }),
    staleTime: Infinity,
    enabled: barcode.length > 0,
  })
