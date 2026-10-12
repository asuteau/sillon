import { hashKey } from '@tanstack/react-query'
import type {
  Query,
  QueryClient,
  QueryFunctionContext,
} from '@tanstack/react-query'

import { sessionUserQueryOptions } from '#/features/auth/auth.queries'
import { DISCOGS_MAX_AGE_MS } from '#/shared/utils/discogs-freshness'
import { idbStore } from '#/shared/utils/idb-store'
import type { KeyValueStore } from '#/shared/utils/idb-store'

import { z } from 'zod'

import type { CollectionPages } from './collection.queries'
import { CollectionPageSchema } from './collection.schema'

// The Collection list cache kept on device, so a relaunch skips the rescan
// (ADR 0004). Bump the version when the stored shape changes.
const STORAGE_KEY = 'collection-list'
const VERSION = 1

const PersistedCollectionSchema = z.object({
  version: z.literal(VERSION),
  username: z.string(),
  data: z.object({
    pages: z.array(CollectionPageSchema.extend({ fetchedAt: z.number() })),
    pageParams: z.array(z.number()),
  }),
})

type PersistedCollection = z.infer<typeof PersistedCollectionSchema>

// Freshness runs from the oldest page's Discogs fetch, not from the save
const isFresh = (data: CollectionPages, now: number) =>
  data.pages.length > 0 &&
  data.pages.every((page) => now - page.fetchedAt <= DISCOGS_MAX_AGE_MS)

const sessionHash = hashKey(sessionUserQueryOptions.queryKey)

const sessionUsername = (queryClient: QueryClient) =>
  queryClient.getQueryData(sessionUserQueryOptions.queryKey)?.username

// Every access is best-effort: blocked storage leaves the cache in memory only
export const createCollectionPersistence = (
  store: KeyValueStore,
  now = () => Date.now(),
) => {
  const clear = () => store.del(STORAGE_KEY).catch(() => undefined)

  const restore = async (
    username: string,
  ): Promise<CollectionPages | undefined> => {
    const stored = await store.get(STORAGE_KEY).catch(() => undefined)
    if (stored === undefined) return undefined
    const entry = PersistedCollectionSchema.safeParse(stored)
    if (
      entry.success &&
      entry.data.username === username &&
      isFresh(entry.data.data, now())
    )
      return entry.data.data
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

  // Saves every change to the persisted query, fetched or patched, drops it
  // once marked out of date, and wipes it once signed out
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
      if (event.type !== 'updated' || query.options.persister !== persister)
        return
      // Invalidated without a patch (an add the read lagged behind): the
      // copy on device lacks it, so the next launch must ask Discogs
      if (event.action.type === 'invalidate') {
        void clear()
        return
      }
      if (event.action.type !== 'success') return
      const username = sessionUsername(queryClient)
      const data = query.state.data as CollectionPages | undefined
      if (!username || !data) return
      const entry: PersistedCollection = { version: VERSION, username, data }
      store.set(STORAGE_KEY, entry).catch(() => undefined)
    })
  }

  return { persister, connect }
}

export const collectionPersistence = createCollectionPersistence(
  idbStore('sillon', 'query-cache'),
)
