import { formatYear } from './list-sort'
import type { SortKey } from './list-sort'

export const formatDateAdded = (dateAdded: string): string =>
  new Date(dateAdded).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

// A row's catalogue line: the year when sorted by year, else the date added
export const formatListMeta = (
  release: { date_added: string; basic_information: { year: number } },
  sort: SortKey,
): string =>
  sort === 'year'
    ? formatYear(release.basic_information.year)
    : formatDateAdded(release.date_added)
