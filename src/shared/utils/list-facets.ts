import { stripDisambiguator } from './artist-name'
import {
  addedYear,
  creditedArtists,
  filterRecords,
  pressingDecade,
  withoutFilter,
} from './list-filter'
import type { FilterableRecord, ListFilters } from './list-filter'

// Facets: the values a Filter picker offers, each with its record count. A
// kind's values are counted over the list narrowed by the other kinds' active
// filters, never its own, so any value picked gives a non-empty list and can
// replace the active one.

export type FacetValue<TValue> = {
  value: TValue
  label: string
  count: number
}

export type ArtistFacetValue = FacetValue<number> & {
  /** Every name the artist is credited under on the list, for search */
  names: string[]
}

export type ListFacets = {
  artist: ArtistFacetValue[]
  style: FacetValue<string>[]
  decade: FacetValue<number>[]
  added: FacetValue<number>[]
}

const tally = <TValue>(
  records: FilterableRecord[],
  valuesOf: (record: FilterableRecord) => Iterable<TValue>,
) => {
  const counts = new Map<TValue, number>()
  for (const record of records)
    for (const value of new Set(valuesOf(record)))
      counts.set(value, (counts.get(value) ?? 0) + 1)
  return counts
}

// The active value stays listed, so it can be cleared, even once a change
// on the list leaves nothing matching it
const withActive = <TValue>(
  counts: Map<TValue, number>,
  active: TValue | undefined,
) => {
  if (active !== undefined && !counts.has(active)) counts.set(active, 0)
  return [...counts]
}

const byCountThenLabel = <TValue>(
  a: FacetValue<TValue>,
  b: FacetValue<TValue>,
) => b.count - a.count || a.label.localeCompare(b.label)

const newestFirst = (a: FacetValue<number>, b: FacetValue<number>) =>
  b.value - a.value

const artistFacet = (
  records: FilterableRecord[],
  active: number | undefined,
): ArtistFacetValue[] => {
  const names = new Map<number, Set<string>>()
  for (const record of records)
    for (const artist of record.basic_information.artists) {
      const known = names.get(artist.id) ?? new Set<string>()
      known.add(stripDisambiguator(artist.name))
      if (artist.anv) known.add(artist.anv)
      names.set(artist.id, known)
    }
  const counts = tally(records, (record) =>
    creditedArtists(record.basic_information.artists).map(({ id }) => id),
  )
  return withActive(counts, active)
    .map(([id, count]) => {
      const artistNames = [...(names.get(id) ?? [])]
      return {
        value: id,
        label: artistNames[0] ?? 'Artist',
        count,
        names: artistNames,
      }
    })
    .sort((a, b) => byCountThenLabel(a, b) || a.value - b.value)
}

const yearFacet = (
  counts: Map<number, number>,
  active: number | undefined,
  label: (value: number) => string,
): FacetValue<number>[] =>
  withActive(counts, active)
    .map(([value, count]) => ({ value, label: label(value), count }))
    .sort(newestFirst)

export const listFacets = (
  records: FilterableRecord[],
  filters: ListFilters,
): ListFacets => {
  const narrowed = (kind: keyof ListFilters) =>
    filterRecords(records, withoutFilter(filters, kind))

  const styles = tally(
    narrowed('style'),
    (record) => record.basic_information.styles,
  )
  const decades = tally(narrowed('decade'), (record) => {
    const decade = pressingDecade(record.basic_information.year)
    return decade === undefined ? [] : [decade]
  })
  const added = tally(narrowed('added'), (record) => [
    addedYear(record.date_added),
  ])

  return {
    artist: artistFacet(narrowed('artist'), filters.artist),
    style: withActive(styles, filters.style)
      .map(([value, count]) => ({ value, label: value, count }))
      .sort(byCountThenLabel),
    decade: yearFacet(decades, filters.decade, (decade) => `${decade}s`),
    added: yearFacet(added, filters.added, String),
  }
}

const fold = (text: string) =>
  text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()

// An artist matches by any name it is credited under on the list
export const searchArtists = (
  artists: ArtistFacetValue[],
  query: string,
): ArtistFacetValue[] => {
  const needle = fold(query.trim())
  if (!needle) return artists
  return artists.filter((artist) =>
    artist.names.some((name) => fold(name).includes(needle)),
  )
}
