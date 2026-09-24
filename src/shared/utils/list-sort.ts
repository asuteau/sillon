import { z } from 'zod'

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

export const formatYear = (year: number): string =>
  year > 0 ? String(year) : '—'
