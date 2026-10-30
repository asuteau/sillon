// @vitest-environment jsdom
import { fireEvent, render, screen, within } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { FullListRead } from '#/shared/hooks/use-full-list-read'
import type { FilterableRecord } from '#/shared/utils/list-filter'
import type { SortableRecord } from '#/shared/utils/list-sort'

import { FilteredListView } from './FilteredList'

vi.mock('@tanstack/react-router', () => ({
  Link: ({
    to,
    search,
    children,
  }: {
    to: string
    search?: Record<string, string>
    children: ReactNode
  }) => (
    <a href={search ? `${to}?${new URLSearchParams(search)}` : to}>
      {children}
    </a>
  ),
}))

beforeEach(() => {
  vi.stubGlobal('matchMedia', () => ({
    matches: false,
    addEventListener: () => {},
    removeEventListener: () => {},
  }))
})

afterEach(() => {
  vi.unstubAllGlobals()
})

type ListRecord = FilterableRecord & SortableRecord

const NIRVANA = { id: 125246, name: 'Nirvana' }
const KORN = { id: 33285, name: 'Korn' }

let nextId = 1

const record = (
  title: string,
  {
    artists = [NIRVANA],
    styles = ['Grunge'],
    year = 1991,
  }: { artists?: (typeof NIRVANA)[]; styles?: string[]; year?: number } = {},
): ListRecord => {
  const id = nextId++
  return {
    id,
    date_added: `2021-0${id % 9 || 1}-01T10:00:00-08:00`,
    basic_information: { title, year, artists, styles },
  }
}

const RECORDS = [
  record('Nevermind'),
  record('Bleach', { year: 1989 }),
  record('Issues', { artists: [KORN], styles: ['Nu Metal'], year: 1999 }),
]

const READ: FullListRead<ListRecord> = { status: 'read', records: RECORDS }

const READING = {
  status: 'reading',
  read: 100,
  total: 250,
  requestsLeft: 2,
  isComplete: false,
  hasGap: false,
} as const

const VIEW = {
  list: 'collection',
  read: READ,
  listSort: { sort: 'added', order: 'desc' },
  onRemoveFilter: () => {},
  onClearFilters: () => {},
  onRetry: () => {},
  recordKey: (r: ListRecord) => r.id,
  renderRecord: (r: ListRecord) => (
    <button type="button">{r.basic_information.title}</button>
  ),
} as const

const rows = () =>
  within(screen.getByRole('list'))
    .getAllByRole('button')
    .map((row) => row.textContent)

describe('FilteredListView', () => {
  it('shows the reading state until every record is read, never partial', () => {
    render(
      <FilteredListView
        {...VIEW}
        filters={{ style: 'Grunge' }}
        read={READING}
      />,
    )

    expect(
      screen.getByRole('progressbar', { name: 'Reading your collection' }),
    ).toBeTruthy()
    expect(screen.queryByRole('list')).toBeNull()
  })

  it('names the list it reads', () => {
    render(
      <FilteredListView
        {...VIEW}
        list="wantlist"
        filters={{ style: 'Grunge' }}
        read={READING}
      />,
    )

    expect(
      screen.getByRole('progressbar', { name: 'Reading your wantlist' }),
    ).toBeTruthy()
  })

  it('shows the matching records, sorted, with their count', () => {
    render(
      <FilteredListView
        {...VIEW}
        listSort={{ sort: 'year', order: 'asc' }}
        filters={{ artist: NIRVANA.id }}
      />,
    )

    expect(screen.getByText('2 records')).toBeTruthy()
    expect(rows()).toEqual(['Bleach', 'Nevermind'])
  })

  it('labels a chip per filter, each removing its own', () => {
    const onRemoveFilter = vi.fn()
    render(
      <FilteredListView
        {...VIEW}
        filters={{ artist: NIRVANA.id, decade: 1990, added: 2021 }}
        onRemoveFilter={onRemoveFilter}
      />,
    )

    const chips = within(screen.getByRole('group', { name: 'Filters' }))
    expect(
      chips.getAllByRole('button').map((chip) => chip.textContent),
    ).toEqual(['Nirvana', '1990s', 'Added in 2021'])

    fireEvent.click(chips.getByRole('button', { name: 'Remove 1990s' }))
    expect(onRemoveFilter).toHaveBeenCalledWith('decade')
  })

  it("links an artist filter to that artist's Discography", () => {
    render(<FilteredListView {...VIEW} filters={{ artist: KORN.id }} />)

    expect(
      screen.getByRole('link', { name: 'Discography' }).getAttribute('href'),
    ).toBe(`/search?artistId=${KORN.id}&artistName=Korn`)
  })

  it('offers to clear filters once none match', () => {
    const onClearFilters = vi.fn()
    render(
      <FilteredListView
        {...VIEW}
        filters={{ style: 'Shoegaze' }}
        onClearFilters={onClearFilters}
      />,
    )

    expect(screen.getByText('No records match')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }))
    expect(onClearFilters).toHaveBeenCalled()
  })

  it('offers a retry when Discogs fails', () => {
    const onRetry = vi.fn()
    render(
      <FilteredListView
        {...VIEW}
        filters={{ style: 'Grunge' }}
        read={{
          status: 'failed',
          read: 0,
          total: undefined,
          requestsLeft: undefined,
        }}
        onRetry={onRetry}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(onRetry).toHaveBeenCalled()
  })
})
