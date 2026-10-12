import { hashKey } from '@tanstack/react-query'
import type {
  InfiniteData,
  Query,
  QueryClient,
  QueryFunctionContext,
} from '@tanstack/react-query'

import { sessionUserQueryOptions } from '#/features/auth/auth.queries'
import { DISCOGS_MAX_AGE_MS } from '#/shared/utils/discogs-freshness'
import { idbStore } from '#/shared/utils/idb-store'
import type { KeyValueStore } from '#/shared/utils/idb-store'

import type { CollectionListPage } from './collection.queries'

export type { KeyValueStore }

// The Collection list cache kept on device, so a relaunch skips the rescan
// (ADR 0004). Bump the version when the stored shape changes.
const KEY = 'collection-list'
const VERSION = 1

type Pages = InfiniteData<CollectionListPage, number>

interface Entry {
  version: number
  username: string
  data: Pages
}

const isEntry = (value: unknown): value is Entry =>
  typeof value === 'object' &&
  value !== null &&
  'version' in value &&
  value.version === VERSION &&
  'username' in value &&
  'data' in value

// Freshness runs from the oldest page's Discogs fetch, not from the save
const isFresh = (data: Pages, now: number) =>
  data.pages.length > 0 &&
  data.pages.every(
    (page) =>
      typeof page.fetchedAt === 'number' &&
      now - page.fetchedAt <= DISCOGS_MAX_AGE_MS,
  )

const sessionHash = hashKey(sessionUserQueryOptions.queryKey)

const sessionUsername = (queryClient: QueryClient) =>
  queryClient.getQueryData(sessionUserQueryOptions.queryKey)?.username

// Every access is best-effort: blocked storage leaves the cache in memory only
export function createCollectionPersistence(
  store: KeyValueStore,
  now = () => Date.now(),
) {
  const clear = () => store.del(KEY).catch(() => undefined)

  const restore = async (username: string): Promise<Pages | undefined> => {
    const entry = await store.get(KEY).catch(() => undefined)
    if (entry === undefined) return undefined
    if (
      isEntry(entry) &&
      entry.username === username &&
      isFresh(entry.data, now())
    )
      return entry.data
    void clear()
    return undefined
  }

  // Only the first fetch on this device reads storage back. Typed loosely:
  // for an infinite query, queryFn and the result are the whole page list.
  const persister = async (
    queryFn: (context: never) => unknown,
    context: QueryFunctionContext,
    query: Query,
  ): Promise<never> => {
    const username = sessionUsername(context.client)
    if (query.state.data === undefined && username) {
      const restored = await restore(username)
      if (restored) return restored as never
    }
    return (await queryFn(context as never)) as never
  }

  // Saves every change to the persisted query, fetched or patched, and
  // wipes it once signed out
  const connect = (queryClient: QueryClient) => {
    if (queryClient.getQueryData(sessionUserQueryOptions.queryKey) === null)
      void clear()

    return queryClient.getQueryCache().subscribe((event) => {
      const { query } = event
      if (query.queryHash === sessionHash) {
        if (query.state.status === 'success' && query.state.data === null)
          void clear()
        return
      }
      if (
        event.type !== 'updated' ||
        event.action.type !== 'success' ||
        query.options.persister !== persister
      )
        return
      const username = sessionUsername(queryClient)
      const data = query.state.data as Pages | undefined
      if (!username || !data) return
      const entry: Entry = { version: VERSION, username, data }
      store.set(KEY, entry).catch(() => undefined)
    })
  }

  return { persister, connect }
}

export const collectionPersistence = createCollectionPersistence(
  idbStore('sillon', 'query-cache'),
)
