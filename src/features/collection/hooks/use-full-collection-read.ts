import { useFullListRead } from '#/shared/hooks/use-full-list-read'
import type { FullListRead } from '#/shared/hooks/use-full-list-read'

import { collectionReader } from '../collection.model'
import { newestFirstQueryOptions } from '../collection.queries'
import type { CollectionRelease } from '../collection.schema'

/** Every Copy once read, newest first */
export type FullCollectionRead = FullListRead<CollectionRelease>

// The whole Collection through the one Collection cache (persisted, ADR
// 0004). Off for an empty Collection.
export const useFullCollectionRead = (enabled: boolean) =>
  useFullListRead(newestFirstQueryOptions, collectionReader, enabled)
