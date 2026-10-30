import { uniqueRecords } from '#/shared/utils/full-read'
import type { ListReader } from '#/shared/utils/full-read'

import type {
  CollectionPage,
  CollectionRelease,
  CollectionValue,
} from './collection.schema'
import { parseAmount } from './collection.utils'

/** A page stamped with when it was asked of Discogs, to tell its age */
export type CollectionListPage = CollectionPage & { fetchedAt: number }

export type CollectionRecord = {
  id: number
  instanceId: number
  dateAdded: string
  title: string
  year: number
  artists: string[]
}

export function toRecord(release: CollectionRelease): CollectionRecord {
  return {
    id: release.id,
    instanceId: release.instance_id,
    dateAdded: release.date_added,
    title: release.basic_information.title,
    year: release.basic_information.year,
    artists: release.basic_information.artists.map((a) => a.name),
  }
}

// Null when Discogs has nothing to estimate (empty Collection, no sales history)
export type EstimatedValue = {
  minimum: number
  median: number
  maximum: number
} | null

export function toEstimatedValue(value: CollectionValue): EstimatedValue {
  const median = parseAmount(value.median)
  if (median === null || median === 0) return null
  return {
    minimum: parseAmount(value.minimum) ?? median,
    median,
    maximum: parseAmount(value.maximum) ?? median,
  }
}

// A Copy read twice (pages shifting under a read) still counts once
export const uniqueCopies = (releases: CollectionRelease[]) =>
  uniqueRecords(releases, (release) => release.instance_id)

// Copies tell apart by instance: one release can be owned twice
export const collectionReader: ListReader<
  CollectionListPage,
  CollectionRelease
> = {
  recordsOf: (page) => page.releases,
  keyOf: (release) => release.instance_id,
}
