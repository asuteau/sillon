// @vitest-environment jsdom
import { fireEvent, render, screen, within } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { CollectionRelease } from '../collection.schema'
import type { FullCollectionRead } from '../hooks/use-full-collection-read'

import { FilteredCollectionView } from './FilteredCollection'

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

// Rows show their title and catalogue line; Covers are out of scope here
vi.mock('./ReleaseRow', () => ({
  ReleaseRow: ({
    release,
    meta,
    onClick,
  }: {
    release: CollectionRelease
    meta: string
    onClick: () => void
  }) => (
    <button type="button" onClick={onClick}>
      {release.basic_information.title} · {meta}
    </button>
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

const NIRVANA = { id: 125246, name: 'Nirvana' }
const KORN = { id: 33285, name: 'Korn' }

let nextInstance = 1

const copy = (
  title: string,
  {
    artists = [NIRVANA],
    styles = ['Grunge'],
    year = 1991,
  }: { artists?: (typeof NIRVANA)[]; styles?: string[]; year?: number } = {},
) => {
  const instanceId = nextInstance++
  return {
    id: instanceId,
    instance_id: instanceId,
    folder_id: 1,
    date_added: `2021-0${instanceId % 9 || 1}-01T10:00:00-08:00`,
    basic_information: {
      title,
      year,
      artists,
      styles,
      cover_image: '',
      thumb: '',
      formats: [],
      labels: [],
    },
  } satisfies CollectionRelease
}

const COPIES = [
  copy('Nevermind'),
  copy('Bleach', { year: 1989 }),
  copy('Issues', { artists: [KORN], styles: ['Nu Metal'], year: 1999 }),
]

const READ: FullCollectionRead = { status: 'read', copies: COPIES }

const VIEW = {
  read: READ,
  listSort: { sort: 'added', order: 'desc' } as const,
  onRemoveFilter: () => {},
  onClearFilters: () => {},
  onRetry: () => {},
  onSelect: () => {},
}

const rows = () =>
  within(screen.getByRole('list'))
    .getAllByRole('button')
    .map((row) => row.textContent)

describe('FilteredCollectionView', () => {
  it('shows the reading state until every Copy is read, never partial', () => {
    render(
      <FilteredCollectionView
        {...VIEW}
        filters={{ style: 'Grunge' }}
        read={{
          status: 'reading',
          read: 100,
          total: 250,
          requestsLeft: 2,
          isComplete: false,
          hasGap: false,
        }}
      />,
    )

    expect(screen.getByRole('progressbar')).toBeTruthy()
    expect(screen.queryByRole('list')).toBeNull()
  })

  it('shows the matching records, sorted, with their count', () => {
    render(
      <FilteredCollectionView
        {...VIEW}
        listSort={{ sort: 'year', order: 'asc' }}
        filters={{ artist: NIRVANA.id }}
      />,
    )

    expect(screen.getByText('2 records')).toBeTruthy()
    expect(rows()).toEqual(['Bleach · 1989', 'Nevermind · 1991'])
  })

  it('labels a chip per filter, each removing its own', () => {
    const onRemoveFilter = vi.fn()
    render(
      <FilteredCollectionView
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
    render(<FilteredCollectionView {...VIEW} filters={{ artist: KORN.id }} />)

    expect(
      screen.getByRole('link', { name: 'Discography' }).getAttribute('href'),
    ).toBe(`/search?artistId=${KORN.id}&artistName=Korn`)
  })

  it('offers to clear filters once none match', () => {
    const onClearFilters = vi.fn()
    render(
      <FilteredCollectionView
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
      <FilteredCollectionView
        {...VIEW}
        filters={{ style: 'Grunge' }}
        read={{
          status: 'failed',
          read: 0,
          total: undefined,
          requestsLeft: undefined,
          isComplete: false,
          hasGap: false,
        }}
        onRetry={onRetry}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(onRetry).toHaveBeenCalled()
  })
})
