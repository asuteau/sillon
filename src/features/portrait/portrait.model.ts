import type { CollectionPages } from '#/features/collection/collection.queries'
import type { CollectionRelease } from '#/features/collection/collection.schema'
import { stripDisambiguator } from '#/shared/utils/artist-name'

const TOP_COUNT = 10

// Discogs' "Various" credit on compilations: not an artist
const VARIOUS_ARTIST_ID = 194

export type TopArtist = { id: number; name: string; copies: number }
export type TopStyle = { name: string; copies: number }

// A Copy read twice (pages shifting under a scan) still counts once
const uniqueCopies = (releases: CollectionRelease[]) => [
  ...new Map(releases.map((r) => [r.instance_id, r])).values(),
]

const byCopiesThenName = <T extends { name: string; copies: number }>(
  a: T,
  b: T,
) => b.copies - a.copies || a.name.localeCompare(b.name)

// Every main artist credited counts, told apart by Discogs id: Name variations
// merge, homonyms stay apart. A single-Copy artist is never top.
export const topArtists = (releases: CollectionRelease[]): TopArtist[] => {
  const counts = new Map<number, TopArtist>()
  for (const release of uniqueCopies(releases)) {
    const artists = new Map(
      release.basic_information.artists.map((a) => [a.id, a]),
    )
    for (const [id, artist] of artists) {
      if (id === VARIOUS_ARTIST_ID) continue
      const entry = counts.get(id) ?? {
        id,
        name: stripDisambiguator(artist.name),
        copies: 0,
      }
      entry.copies++
      counts.set(id, entry)
    }
  }
  return [...counts.values()]
    .filter((artist) => artist.copies > 1)
    .sort((a, b) => byCopiesThenName(a, b) || a.id - b.id)
    .slice(0, TOP_COUNT)
}

// A Copy counts once for each style it carries
export const topStyles = (releases: CollectionRelease[]): TopStyle[] => {
  const counts = new Map<string, number>()
  for (const release of uniqueCopies(releases))
    for (const style of new Set(release.basic_information.styles))
      counts.set(style, (counts.get(style) ?? 0) + 1)
  return [...counts]
    .map(([name, copies]) => ({ name, copies }))
    .sort(byCopiesThenName)
    .slice(0, TOP_COUNT)
}

export type DecadeCount = { decade: number; copies: number }
export type YearCount = { year: number; copies: number }
export type PressingDecades = {
  /** First to last decade, gaps as zero */
  decades: DecadeCount[]
  /** Copies whose Release has no year (Discogs' 0), left out */
  noYear: number
}

// Every step from the first key to the last, gaps as zero
const fillSteps = (counts: Map<number, number>, step: number) => {
  if (counts.size === 0) return []
  const keys = [...counts.keys()]
  const first = Math.min(...keys)
  const last = Math.max(...keys)
  return Array.from({ length: (last - first) / step + 1 }, (_, i) => {
    const key = first + i * step
    return { key, copies: counts.get(key) ?? 0 }
  })
}

const increment = (counts: Map<number, number>, key: number) =>
  counts.set(key, (counts.get(key) ?? 0) + 1)

// The Release year, not the original year: a 2016 reissue counts in the 2010s
export const pressingDecades = (
  releases: CollectionRelease[],
): PressingDecades => {
  const counts = new Map<number, number>()
  let noYear = 0
  for (const release of uniqueCopies(releases)) {
    const { year } = release.basic_information
    if (year > 0) increment(counts, Math.floor(year / 10) * 10)
    else noYear++
  }
  return {
    decades: fillSteps(counts, 10).map(({ key, copies }) => ({
      decade: key,
      copies,
    })),
    noYear,
  }
}

// The year added to Discogs, as Discogs dates it, not when it was bought
export const additionsByYear = (releases: CollectionRelease[]): YearCount[] => {
  const counts = new Map<number, number>()
  for (const release of uniqueCopies(releases))
    increment(counts, Number(release.date_added.slice(0, 4)))
  return fillSteps(counts, 1).map(({ key, copies }) => ({ year: key, copies }))
}

// One page per 1.5s: at most 40 of Discogs' 60 requests a minute, leaving
// headroom for the rest of the app
export const SCAN_PACE_MS = 1500

// Paced from the last page's Discogs fetch, so pages already in the cache
// (loaded by the Collection page, restored from the device) cost no wait
export const nextReadDelay = (lastFetchedAt: number, now: number) =>
  Math.max(0, lastFetchedAt + SCAN_PACE_MS - now)

export type ScanProgress = {
  read: number
  /** Record count, unknown before the first page */
  total: number | undefined
  /** Every Copy read: only then do scan-based figures show */
  isComplete: boolean
  /** Every page read, yet Copies missing: a removal shifted Discogs' pages
   *  under the scan, or restored pages predate a change made elsewhere */
  hasGap: boolean
}

export const scanProgress = (
  data: Pick<CollectionPages, 'pages'> | undefined,
): ScanProgress => {
  const last = data?.pages.at(-1)
  if (!data || !last)
    return { read: 0, total: undefined, isComplete: false, hasGap: false }
  const total = last.pagination.items
  const read = Math.min(
    uniqueCopies(data.pages.flatMap((page) => page.releases)).length,
    total,
  )
  const isLastPage = last.pagination.page >= last.pagination.pages
  return {
    read,
    total,
    isComplete: isLastPage && read === total,
    hasGap: isLastPage && read < total,
  }
}
