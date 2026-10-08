import type { CollectionRelease, CollectionValue } from './collection.schema'
import { parseAmount } from './collection.utils'

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
