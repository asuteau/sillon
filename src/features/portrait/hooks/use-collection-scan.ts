import { useMemo } from 'react'

import type { ReadProgress } from '#/features/collection/collection.model'
import { useFullCollectionRead } from '#/features/collection/hooks/use-full-collection-read'

import {
  additionsByYear,
  pressingDecades,
  topArtists,
  topStyles,
} from '../portrait.model'
import type {
  PressingDecades,
  TopArtist,
  TopStyle,
  YearCount,
} from '../portrait.model'

export type CollectionScan =
  | ({ status: 'reading' } & ReadProgress)
  | ({ status: 'failed' } & ReadProgress)
  | {
      status: 'read'
      topArtists: TopArtist[]
      topStyles: TopStyle[]
      pressingDecades: PressingDecades
      additionsByYear: YearCount[]
    }

// The Portrait's figures over the full Collection read: only once every Copy
// is read, never partial. Off for an empty Collection.
export const useCollectionScan = (
  enabled: boolean,
): { scan: CollectionScan; retry: () => void } => {
  const { read, retry } = useFullCollectionRead(enabled)

  const scan = useMemo((): CollectionScan => {
    if (read.status !== 'read') return read
    return {
      status: 'read',
      topArtists: topArtists(read.copies),
      topStyles: topStyles(read.copies),
      pressingDecades: pressingDecades(read.copies),
      additionsByYear: additionsByYear(read.copies),
    }
  }, [read])

  return { scan, retry }
}
