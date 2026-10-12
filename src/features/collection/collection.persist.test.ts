import { QueryClient, infiniteQueryOptions } from '@tanstack/react-query'
import { describe, expect, it, vi } from 'vitest'

import { sessionUserQueryOptions } from '#/features/auth/auth.queries'
import { DISCOGS_MAX_AGE_MS } from '#/shared/utils/discogs-freshness'

import type { KeyValueStore } from './collection.persist'
import { createCollectionPersistence } from './collection.persist'
import type { CollectionListPage } from './collection.queries'

vi.mock('#/services/session', () => ({}))

const NOW = 1_000_000_000_000
const HOUR = 60 * 60 * 1000

const page = (fetchedAt: number, ids: number[] = [1]): CollectionListPage =>
  ({
    releases: ids.map((id) => ({ instance_id: id })),
    pagination: { page: 1, pages: 1, items: ids.length },
    fetchedAt,
  }) as unknown as CollectionListPage

const entry = (username: string, ...fetchedAt: number[]) => ({
  version: 1,
  username,
  data: {
    pages: fetchedAt.map((at) => page(at, [7])),
    pageParams: fetchedAt.map((_, index) => index + 1),
  },
})

const memoryStore = (initial?: unknown) => {
  const map = new Map<string, unknown>()
  if (initial) map.set('collection-list', initial)
  const store: KeyValueStore = {
    get: vi.fn((key: string) => Promise.resolve(map.get(key))),
    set: vi.fn((key: string, value: unknown) => {
      map.set(key, value)
      return Promise.resolve()
    }),
    del: vi.fn((key: string) => {
      map.delete(key)
      return Promise.resolve()
    }),
  }
  return { store, map }
}

const failingStore: KeyValueStore = {
  get: () => Promise.reject(new Error('blocked')),
  set: () => Promise.reject(new Error('blocked')),
  del: () => Promise.reject(new Error('blocked')),
}

const setup = (store: KeyValueStore, username: string | null = 'ana') => {
  const persistence = createCollectionPersistence(store, () => NOW)
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  queryClient.setQueryData(sessionUserQueryOptions.queryKey, () =>
    username ? { username, numCollection: 1, numWantlist: 0 } : null,
  )
  persistence.connect(queryClient)
  const queryFn = vi.fn(() => Promise.resolve(page(NOW, [1])))
  const options = infiniteQueryOptions({
    queryKey: ['collection', 'list', 'newest'],
    queryFn,
    initialPageParam: 1,
    getNextPageParam: () => undefined,
    persister: persistence.persister,
  })
  return { queryClient, queryFn, options }
}

// Writes are fire-and-forget: let them land
const settle = () => new Promise((resolve) => setTimeout(resolve, 0))

const instanceIds = (data: unknown) =>
  (data as { pages: CollectionListPage[] } | undefined)?.pages.flatMap((p) =>
    p.releases.map((r) => r.instance_id),
  )

describe('collection persistence', () => {
  it('restores a fresh copy without asking Discogs', async () => {
    const { store } = memoryStore(entry('ana', NOW - 5 * HOUR))
    const { queryClient, queryFn, options } = setup(store)

    const data = await queryClient.fetchInfiniteQuery(options)

    expect(queryFn).not.toHaveBeenCalled()
    expect(instanceIds(data)).toEqual([7])
  })

  it('drops a copy fetched more than 6 hours ago, even partly', async () => {
    const { store, map } = memoryStore(
      entry('ana', NOW - DISCOGS_MAX_AGE_MS - 1, NOW - HOUR),
    )
    const { queryClient, queryFn, options } = setup(store)

    const data = await queryClient.fetchInfiniteQuery(options)

    expect(queryFn).toHaveBeenCalledOnce()
    expect(instanceIds(data)).toEqual([1])
    await settle()
    expect(map.get('collection-list')).toMatchObject({
      data: { pages: [{ fetchedAt: NOW }] },
    })
  })

  it("never restores another user's copy", async () => {
    const { store } = memoryStore(entry('bob', NOW))
    const { queryClient, queryFn, options } = setup(store)

    await queryClient.fetchInfiniteQuery(options)

    expect(queryFn).toHaveBeenCalledOnce()
  })

  it('saves fetches and patches alike', async () => {
    const { store, map } = memoryStore()
    const { queryClient, options } = setup(store)

    await queryClient.fetchInfiniteQuery(options)
    await settle()
    expect(
      instanceIds((map.get('collection-list') as { data: unknown }).data),
    ).toEqual([1])

    queryClient.setQueryData(options.queryKey, (old) =>
      old ? { ...old, pages: [page(NOW, [2, 1])] } : old,
    )
    await settle()
    expect(map.get('collection-list')).toMatchObject({ username: 'ana' })
    expect(
      instanceIds((map.get('collection-list') as { data: unknown }).data),
    ).toEqual([2, 1])
  })

  it('saves no other query', async () => {
    const { store } = memoryStore()
    const { queryClient } = setup(store)

    await queryClient.fetchQuery({
      queryKey: ['collection', 'list', 'by-artist'],
      queryFn: () => page(NOW),
    })
    await settle()

    expect(store.set).not.toHaveBeenCalled()
  })

  it('wipes the copy once signed out', async () => {
    const { store, map } = memoryStore(entry('ana', NOW))
    setup(store, null)
    await settle()

    expect(map.has('collection-list')).toBe(false)
  })

  it('falls back to memory when storage is blocked', async () => {
    const { queryClient, queryFn, options } = setup(failingStore)

    const data = await queryClient.fetchInfiniteQuery(options)
    queryClient.setQueryData(options.queryKey, (old) => old)
    await settle()

    expect(queryFn).toHaveBeenCalledOnce()
    expect(instanceIds(data)).toEqual([1])
  })
})
