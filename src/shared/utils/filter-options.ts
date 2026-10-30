import { stripDisambiguator } from './artist-name'
import {
  addedYear,
  creditedArtists,
  filterRecords,
  formatPressingDecade,
  pressingDecade,
  withoutFilter,
} from './list-filter'
import type { FilterableRecord, ListFilters } from './list-filter'

// Filter options: the values a Filter picker offers, each with its record count. A
// kind's values are counted over the list narrowed by the other kinds' active
// filters, never its own, so any value picked gives a non-empty list and can
// replace the active one.

export type FilterOption<TValue> = {
  value: TValue
  label: string
  count: number
}

export type ArtistFilterOption = FilterOption<number> & {
  /** Every name the artist is credited under on the list, for search */
  names: string[]
}

export type ListFilterOptions = {
  artist: ArtistFilterOption[]
  style: FilterOption<string>[]
  decade: FilterOption<number>[]
  added: FilterOption<number>[]
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
  a: FilterOption<TValue>,
  b: FilterOption<TValue>,
) => b.count - a.count || a.label.localeCompare(b.label)

const newestFirst = (a: FilterOption<number>, b: FilterOption<number>) =>
  b.value - a.value

const artistOptions = (
  records: FilterableRecord[],
  active: number | undefined,
): ArtistFilterOption[] => {
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

const yearOptions = (
  counts: Map<number, number>,
  active: number | undefined,
  label: (value: number) => string,
): FilterOption<number>[] =>
  withActive(counts, active)
    .map(([value, count]) => ({ value, label: label(value), count }))
    .sort(newestFirst)

export const listFilterOptions = (
  records: FilterableRecord[],
  filters: ListFilters,
): ListFilterOptions => {
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
    artist: artistOptions(narrowed('artist'), filters.artist),
    style: withActive(styles, filters.style)
      .map(([value, count]) => ({ value, label: value, count }))
      .sort(byCountThenLabel),
    decade: yearOptions(decades, filters.decade, formatPressingDecade),
    added: yearOptions(added, filters.added, String),
  }
}

const fold = (text: string) =>
  text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()

// An artist matches by any name it is credited under on the list
export const searchArtists = (
  artists: ArtistFilterOption[],
  query: string,
): ArtistFilterOption[] => {
  const needle = fold(query.trim())
  if (!needle) return artists
  return artists.filter((artist) =>
    artist.names.some((name) => fold(name).includes(needle)),
  )
}
