import type { CollectionPages } from './collection.queries'
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

// A Copy read twice (pages shifting under a read) still counts once
export const uniqueCopies = (releases: CollectionRelease[]) => [
  ...new Map(releases.map((r) => [r.instance_id, r])).values(),
]

export type ReadProgress = {
  read: number
  /** Record count, unknown before the first page */
  total: number | undefined
  /** Discogs pages still to ask for, unknown before the first page */
  requestsLeft: number | undefined
  /** Every Copy read: only then do figures and filters show */
  isComplete: boolean
  /** Every page read, yet Copies missing: a removal shifted Discogs' pages
   *  under the scan, or restored pages predate a change made elsewhere */
  hasGap: boolean
}

export const readProgress = (
  data: Pick<CollectionPages, 'pages'> | undefined,
): ReadProgress => {
  const last = data?.pages.at(-1)
  if (!data || !last)
    return {
      read: 0,
      total: undefined,
      requestsLeft: undefined,
      isComplete: false,
      hasGap: false,
    }
  const total = last.pagination.items
  const read = Math.min(
    uniqueCopies(data.pages.flatMap((page) => page.releases)).length,
    total,
  )
  const isLastPage = last.pagination.page >= last.pagination.pages
  return {
    read,
    total,
    requestsLeft: Math.max(0, last.pagination.pages - last.pagination.page),
    isComplete: isLastPage && read === total,
    hasGap: isLastPage && read < total,
  }
}
