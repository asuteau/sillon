import { queryOptions } from '@tanstack/react-query'
import type { QueryClient } from '@tanstack/react-query'
import { DISCOGS_MAX_AGE_MS } from '#/shared/utils/discogs-freshness'

import {
  getArtistDetail,
  getArtistMasters,
  getMasterVersions,
  getReleaseDetail,
  searchArtists,
  searchMasters,
} from './search.api'
import type {
  ArtistMasters,
  DiscographyArtist,
  DiscographyFormat,
  MasterResult,
  SearchPage,
} from './search.schema'
import { toSearchRecord } from './search.model'
import { prepareRecordCover } from '#/features/collection/collection.queries'

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

// A Release from Search, whole like a Random pick: the Record screen shows it
// only once its Cover is ready (prepareRecordCover)
export const searchRecordQueryOptions = (
  queryClient: QueryClient,
  releaseId: string,
) =>
  queryOptions({
    queryKey: ['search', 'record', releaseId] as const,
    queryFn: async () => {
      const raw = await queryClient.fetchQuery(
        releaseDetailQueryOptions(releaseId),
      )
      const record = toSearchRecord(raw)
      await prepareRecordCover(queryClient, record)
      return record
    },
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
  artist: DiscographyArtist | undefined,
  format: DiscographyFormat | null,
  enabled = true,
) =>
  queryOptions({
    queryKey: ['search', 'artistMasters', artist?.id, format] as const,
    queryFn: () => getArtistMasters({ data: { artist: artist!, format } }),
    enabled: artist !== undefined && enabled,
    // Up to 11 Discogs requests per artist plus one per unclear credit, and discographies rarely change
    staleTime: DISCOGS_MAX_AGE_MS,
  })

export const artistDetailQueryOptions = (artistId: string) =>
  queryOptions({
    queryKey: ['search', 'artistDetail', artistId] as const,
    queryFn: () => getArtistDetail({ data: { artistId } }),
    staleTime: 30 * 60 * 1000,
  })

type MasterResults = { results: MasterResult[] }

// After a Release of this Master is added or removed, its Owned/Wanted Master
// badge follows what the loaded versions say, without refetching any search
export const syncMasterUserData = (
  queryClient: QueryClient,
  masterId: string,
  field: 'in_collection' | 'in_wantlist',
) => {
  const versions = queryClient.getQueryData(
    versionsQueryOptions(masterId).queryKey,
  )
  if (!versions) return
  const value = versions.versions.some((v) => v.stats.user[field] > 0)

  const patch = <T extends MasterResults>(old: T | undefined): T | undefined =>
    old && {
      ...old,
      results: old.results.map((r) =>
        String(r.id) === masterId
          ? {
              ...r,
              user_data: {
                in_collection: r.user_data?.in_collection ?? false,
                in_wantlist: r.user_data?.in_wantlist ?? false,
                [field]: value,
              },
            }
          : r,
      ),
    }
  queryClient.setQueriesData<SearchPage>(
    { queryKey: ['search', 'masters'] },
    patch,
  )
  queryClient.setQueriesData<ArtistMasters>(
    { queryKey: ['search', 'artistMasters'] },
    patch,
  )
}
