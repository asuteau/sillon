import { z } from 'zod'

import { stripDisambiguator } from './artist-name'

// Filters: a Collection or Wantlist narrowed to the records matching an
// artist, a style, a Pressing decade or the year they were added. One value
// per kind; kinds combine (AND).

/** The fields a record needs to be filtered */
export interface FilterableRecord {
  id: number
  date_added: string
  basic_information: {
    year: number
    styles: string[]
    // anv: the Name variation credited on this record, if any
    artists: { id: number; name: string; anv?: string }[]
  }
}

export type ListFilters = {
  /** Discogs artist ID */
  artist?: number
  style?: string
  /** First year of a Pressing decade, e.g. 1990 */
  decade?: number
  /** Year the record was added to the list */
  added?: number
}

export const FILTER_KINDS = ['artist', 'style', 'decade', 'added'] as const
export type FilterKind = (typeof FILTER_KINDS)[number]

const positiveYear = z.number().int().positive()

// Search params, next to the list sort. A value naming no filter is dropped
// rather than failing the page.
export const listFilterSchema = z.object({
  artist: z.number().int().positive().optional().catch(undefined),
  // The router reads "?style=2" as a number
  style: z.coerce.string().min(1).optional().catch(undefined),
  decade: positiveYear.multipleOf(10).optional().catch(undefined),
  added: positiveYear.optional().catch(undefined),
}) satisfies z.ZodType<ListFilters>

export const hasFilters = (filters: ListFilters) =>
  FILTER_KINDS.some((kind) => filters[kind] !== undefined)

export const pickFilters = ({
  artist,
  style,
  decade,
  added,
}: ListFilters): ListFilters => ({ artist, style, decade, added })

export const withoutFilter = (
  filters: ListFilters,
  kind: FilterKind,
): ListFilters => ({ ...filters, [kind]: undefined })

export type ActiveFilter = { kind: FilterKind; label: string }

/** Active filters in kind order, labelled for chips. The artist's name comes
 *  from the records, the URL holding only its ID. */
export const activeFilters = (
  filters: ListFilters,
  artistName: string | undefined,
): ActiveFilter[] => {
  const labels: Record<FilterKind, string | undefined> = {
    artist: filters.artist === undefined ? undefined : (artistName ?? 'Artist'),
    style: filters.style,
    decade: filters.decade === undefined ? undefined : `${filters.decade}s`,
    added:
      filters.added === undefined ? undefined : `Added in ${filters.added}`,
  }
  return FILTER_KINDS.flatMap((kind) => {
    const label = labels[kind]
    return label === undefined ? [] : [{ kind, label }]
  })
}

// Discogs' "Various" credit on compilations: not an artist
const VARIOUS_ARTIST_ID = 194

// Every main artist credited, once each, told apart by Discogs ID: Name
// variations share their artist's ID, homonyms differ. Top artists counts by
// it, so a filtered count equals the Portrait figure.
export const creditedArtists = <TArtist extends { id: number }>(
  artists: TArtist[],
): TArtist[] => [
  ...new Map(
    artists
      .filter((artist) => artist.id !== VARIOUS_ARTIST_ID)
      .map((artist) => [artist.id, artist]),
  ).values(),
]

// The Release year, not the original year: a 2016 reissue is in the 2010s.
// No year (Discogs' 0) has no decade.
export const pressingDecade = (year: number): number | undefined =>
  year > 0 ? Math.floor(year / 10) * 10 : undefined

// As Discogs dates it, in its own time zone
export const addedYear = (dateAdded: string): number =>
  Number(dateAdded.slice(0, 4))

const matches = (record: FilterableRecord, filters: ListFilters) => {
  const { artists, styles, year } = record.basic_information
  return (
    (filters.artist === undefined ||
      creditedArtists(artists).some(
        (artist) => artist.id === filters.artist,
      )) &&
    (filters.style === undefined || styles.includes(filters.style)) &&
    (filters.decade === undefined || pressingDecade(year) === filters.decade) &&
    (filters.added === undefined ||
      addedYear(record.date_added) === filters.added)
  )
}

// The artist's display name as credited on the list, for its chip
export const filterArtistName = (
  records: FilterableRecord[],
  artistId: number,
): string | undefined => {
  for (const record of records) {
    const artist = record.basic_information.artists.find(
      (a) => a.id === artistId,
    )
    if (artist) return stripDisambiguator(artist.name)
  }
  return undefined
}

export const filterRecords = <TRecord extends FilterableRecord>(
  records: TRecord[],
  filters: ListFilters,
): TRecord[] => records.filter((record) => matches(record, filters))
