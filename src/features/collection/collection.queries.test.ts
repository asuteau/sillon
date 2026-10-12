import { QueryClient } from '@tanstack/react-query'
import type { InfiniteData } from '@tanstack/react-query'
import { describe, expect, it, vi } from 'vitest'

import type { CollectionPage, CollectionRelease } from './collection.schema'
import {
  addCopyToLists,
  collectionQueryOptions,
  removeCopyFromLists,
} from './collection.queries'

vi.mock('./collection.api', () => ({}))
vi.mock('#/services/deezer.api', () => ({}))

type Pages = InfiniteData<CollectionPage, number>

const copy = (instanceId: number) =>
  ({ id: instanceId, instance_id: instanceId }) as unknown as CollectionRelease

const pages = (...releases: number[][]): Pages => ({
  pages: releases.map((ids, index) => ({
    releases: ids.map(copy),
    pagination: { page: index + 1, pages: releases.length, items: 4 },
  })),
  pageParams: releases.map((_, index) => index + 1),
})

const newestFirst = collectionQueryOptions({ sort: 'added', order: 'desc' })
const byArtist = collectionQueryOptions({ sort: 'artist', order: 'asc' })

const ids = (data: InfiniteData<CollectionPage> | undefined) =>
  data?.pages.map((page) => page.releases.map((r) => r.instance_id))

const setup = () => {
  const queryClient = new QueryClient()
  queryClient.setQueryData(newestFirst.queryKey, pages([3, 2], [1, 0]))
  queryClient.setQueryData(byArtist.queryKey, pages([0, 1], [2, 3]))
  return queryClient
}

describe('addCopyToLists', () => {
  it('puts the new Copy at the top of the newest-first list', () => {
    const queryClient = setup()

    addCopyToLists(queryClient, copy(4))

    const data = queryClient.getQueryData(newestFirst.queryKey)
    expect(ids(data)?.flat()).toEqual([4, 3, 2, 1, 0])
    expect(data?.pages.map((page) => page.pagination.items)).toEqual([5, 5])
  })

  it('pushes each page’s last Copy onto the next, as Discogs will', () => {
    const queryClient = new QueryClient()
    // Loaded 2 of 3 pages: page 3 starts with what page 2 pushes out
    queryClient.setQueryData(newestFirst.queryKey, {
      ...pages([5, 4], [3, 2]),
      pages: pages([5, 4], [3, 2]).pages.map((page) => ({
        ...page,
        pagination: { ...page.pagination, pages: 3 },
      })),
    })

    addCopyToLists(queryClient, copy(6))

    expect(ids(queryClient.getQueryData(newestFirst.queryKey))).toEqual([
      [6, 5],
      [4, 3],
    ])
  })

  it('keeps the overflow on the last page when there is no next one', () => {
    const queryClient = setup()

    addCopyToLists(queryClient, copy(4))

    expect(ids(queryClient.getQueryData(newestFirst.queryKey))).toEqual([
      [4, 3],
      [2, 1, 0],
    ])
  })

  it('never lists the same Copy twice', () => {
    const queryClient = setup()

    addCopyToLists(queryClient, copy(3))

    expect(ids(queryClient.getQueryData(newestFirst.queryKey))).toEqual([
      [3, 2],
      [1, 0],
    ])
  })

  it('marks other sorts stale without refetching them', () => {
    const queryClient = setup()

    addCopyToLists(queryClient, copy(4))

    const other = queryClient.getQueryState(byArtist.queryKey)
    expect(other?.isInvalidated).toBe(true)
    expect(other?.fetchStatus).toBe('idle')
    expect(queryClient.getQueryState(newestFirst.queryKey)?.isInvalidated).toBe(
      false,
    )
  })

  it('leaves an unloaded list unloaded', () => {
    const queryClient = new QueryClient()

    addCopyToLists(queryClient, copy(4))

    expect(queryClient.getQueryData(newestFirst.queryKey)).toBeUndefined()
  })
})

describe('removeCopyFromLists', () => {
  it('drops the Copy from every sorted list', () => {
    const queryClient = setup()

    removeCopyFromLists(queryClient, 2)

    expect(ids(queryClient.getQueryData(newestFirst.queryKey))).toEqual([
      [3],
      [1, 0],
    ])
    expect(ids(queryClient.getQueryData(byArtist.queryKey))).toEqual([
      [0, 1],
      [3],
    ])
  })
})
