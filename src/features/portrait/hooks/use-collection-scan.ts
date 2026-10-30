import { useMemo } from 'react'

import type { ReadProgress } from '#/shared/utils/full-read'
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
      topArtists: topArtists(read.records),
      topStyles: topStyles(read.records),
      pressingDecades: pressingDecades(read.records),
      additionsByYear: additionsByYear(read.records),
    }
  }, [read])

  return { scan, retry }
}
