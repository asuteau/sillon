import { z } from 'zod'

import { stripDisambiguator } from './artist-name'

export const SORT_KEYS = ['added', 'artist', 'title', 'year'] as const

export type SortKey = (typeof SORT_KEYS)[number]
export type SortOrder = 'asc' | 'desc'

export const DEFAULT_ORDER: Record<SortKey, SortOrder> = {
  added: 'desc',
  artist: 'asc',
  title: 'asc',
  year: 'desc',
}

export const DEFAULT_SORT_KEY: SortKey = 'added'

export const listSortSchema = z.object({
  sort: z.enum(SORT_KEYS).optional(),
  order: z.enum(['asc', 'desc']).optional(),
})

export type ListSortSearch = z.infer<typeof listSortSchema>

export type ListSort = { sort: SortKey; order: SortOrder }

export const resolveListSort = (search: ListSortSearch): ListSort => {
  const sort = search.sort ?? DEFAULT_SORT_KEY
  return { sort, order: search.order ?? DEFAULT_ORDER[sort] }
}

// Omits values matching defaults so the URL stays clean
export const toListSortSearch = ({
  sort,
  order,
}: ListSort): ListSortSearch => ({
  sort: sort === DEFAULT_SORT_KEY ? undefined : sort,
  order: order === DEFAULT_ORDER[sort] ? undefined : order,
})

export const nextListSort = (current: ListSort, key: SortKey): ListSort =>
  current.sort === key
    ? { sort: key, order: current.order === 'asc' ? 'desc' : 'asc' }
    : { sort: key, order: DEFAULT_ORDER[key] }

/** The fields a record needs to be sorted client-side */
export interface SortableRecord {
  date_added: string
  basic_information: {
    title: string
    year: number
    artists: { name: string }[]
  }
}

const artistKey = ({ basic_information: { artists } }: SortableRecord) =>
  artists.map((artist) => stripDisambiguator(artist.name)).join(', ')

const ascending: Record<
  SortKey,
  (a: SortableRecord, b: SortableRecord) => number
> = {
  added: (a, b) => Date.parse(a.date_added) - Date.parse(b.date_added),
  artist: (a, b) => artistKey(a).localeCompare(artistKey(b)),
  title: (a, b) =>
    a.basic_information.title.localeCompare(b.basic_information.title),
  year: (a, b) => a.basic_information.year - b.basic_information.year,
}

// A list sorted on the device, as Discogs would sort it. Ties keep the order
// given (newest first, from the Collection cache).
export const sortRecords = <TRecord extends SortableRecord>(
  records: TRecord[],
  { sort, order }: ListSort,
): TRecord[] => {
  const compare = ascending[sort]
  return [...records].sort((a, b) =>
    order === 'asc' ? compare(a, b) : compare(b, a),
  )
}

export const formatYear = (year: number): string =>
  year > 0 ? String(year) : '—'
