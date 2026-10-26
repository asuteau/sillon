import { QueryClient } from '@tanstack/react-query'
import { describe, expect, it } from 'vitest'

import { syncMasterUserData, versionsQueryOptions } from './search.queries'
import type {
  ArtistMasters,
  MasterResult,
  SearchPage,
  Version,
} from './search.schema'

const version = (id: number, inCollection: number): Version => ({
  id,
  thumb: '',
  released: '1991',
  country: 'UK',
  major_formats: ['Vinyl'],
  format: 'LP',
  stats: { user: { in_collection: inCollection, in_wantlist: 0 } },
})

const master = (id: number, inCollection: boolean): MasterResult => ({
  id,
  title: 'My Bloody Valentine - Loveless',
  thumb: '',
  cover_image: '',
  user_data: { in_collection: inCollection, in_wantlist: false },
})

const setup = (versions: Version[], owned: boolean) => {
  const queryClient = new QueryClient()
  queryClient.setQueryData(versionsQueryOptions('1').queryKey, {
    versions,
    pagination: { page: 1, pages: 1, items: versions.length },
  })
  queryClient.setQueryData<ArtistMasters>(
    ['search', 'artistMasters', 7, 'Album'],
    { results: [master(1, owned), master(2, true)], truncated: false },
  )
  queryClient.setQueryData<SearchPage>(['search', 'masters', 'loveless'], {
    results: [master(1, owned)],
    pagination: { page: 1, pages: 1, items: 1 },
  })
  return queryClient
}

const ownedIn = (queryClient: QueryClient) => ({
  discography: queryClient
    .getQueryData<ArtistMasters>(['search', 'artistMasters', 7, 'Album'])
    ?.results.map((r) => r.user_data?.in_collection),
  search: queryClient
    .getQueryData<SearchPage>(['search', 'masters', 'loveless'])
    ?.results.map((r) => r.user_data?.in_collection),
})

describe('syncMasterUserData', () => {
  it('marks the Master owned once one of its Releases is added', () => {
    const queryClient = setup([version(10, 1), version(11, 0)], false)

    syncMasterUserData(queryClient, '1', 'in_collection')

    expect(ownedIn(queryClient)).toEqual({
      discography: [true, true],
      search: [true],
    })
  })

  it('keeps the Master owned while another Release still is', () => {
    const queryClient = setup([version(10, 0), version(11, 1)], true)

    syncMasterUserData(queryClient, '1', 'in_collection')

    expect(ownedIn(queryClient).discography).toEqual([true, true])
  })

  it('clears the Master once its last owned Release is removed', () => {
    const queryClient = setup([version(10, 0), version(11, 0)], true)

    syncMasterUserData(queryClient, '1', 'in_collection')

    expect(ownedIn(queryClient)).toEqual({
      discography: [false, true],
      search: [false],
    })
  })
})
