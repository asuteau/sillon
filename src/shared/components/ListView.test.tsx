// @vitest-environment jsdom
import {
  infiniteQueryOptions,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { Suspense } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { ListSort } from '#/shared/utils/list-sort'

import { ListRecords } from './ListView'

type Record = {
  id: number
  date_added: string
  basic_information: {
    title: string
    year: number
    styles: string[]
    artists: { id: number; name: string }[]
  }
}
type RecordsPage = {
  records: Record[]
  pagination: { page: number; pages: number; items: number }
  fetchedAt: number
}

const record = (id: number, artist: string, title: string): Record => ({
  id,
  date_added: `2021-01-0${id}T10:00:00-08:00`,
  basic_information: {
    title,
    year: 1991,
    styles: [],
    artists: [{ id: id * 10, name: artist }],
  },
})

// Newest first, as the full read holds them
const RECORDS = [
  record(3, 'Slowdive', 'Souvlaki'),
  record(2, 'Autechre', 'Amber'),
  record(1, 'Nirvana', 'Nevermind'),
]

const pageOf = (
  records: Record[],
  page: number,
  pages: number,
  items = RECORDS.length,
): RecordsPage => ({
  records,
  pagination: { page, pages, items },
  fetchedAt: 0,
})

// Sorted pages as Discogs serves them: a spy, so a request shows
const fetchSorted = vi.fn(
  async (_listSort: ListSort, page: number): Promise<RecordsPage> =>
    pageOf(RECORDS.slice(page - 1, page), page, RECORDS.length),
)

const pagedOptions = (listSort: ListSort) =>
  infiniteQueryOptions({
    queryKey: ['records', listSort],
    queryFn: ({ pageParam }) => fetchSorted(listSort, pageParam),
    initialPageParam: 1,
    getNextPageParam: (last: RecordsPage) =>
      last.pagination.page < last.pagination.pages
        ? last.pagination.page + 1
        : undefined,
  })

const newestFirst = pagedOptions({ sort: 'added', order: 'desc' })

const CONFIG = {
  source: {
    list: 'wantlist' as const,
    options: newestFirst,
    reader: {
      recordsOf: (page: RecordsPage) => page.records,
      keyOf: (r: Record) => r.id,
    },
  },
  pagedOptions,
  empty: 'Your wantlist is empty.',
  servesWholeRead: true,
}

const BY_ARTIST: ListSort = { sort: 'artist', order: 'asc' }

let queryClient: QueryClient
beforeEach(() => {
  fetchSorted.mockClear()
  queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  })
})

const renderList = (listSort: ListSort) =>
  render(
    <QueryClientProvider client={queryClient}>
      <Suspense fallback={<p>Loading</p>}>
        <ListRecords
          config={CONFIG}
          listSort={listSort}
          isSortPending={false}
          heading={() => null}
          renderRecord={(r) => r.basic_information.title}
        />
      </Suspense>
    </QueryClientProvider>,
  )

const titles = () =>
  screen.getAllByRole('listitem').map((item) => item.textContent)

describe('ListRecords', () => {
  it('serves the unfiltered list from a whole read, sorted on the device', async () => {
    queryClient.setQueryData(newestFirst.queryKey, {
      pages: [pageOf(RECORDS, 1, 1)],
      pageParams: [1],
    })

    renderList(BY_ARTIST)

    expect(await screen.findAllByRole('listitem')).toHaveLength(3)
    expect(titles()).toEqual(['Amber', 'Nevermind', 'Souvlaki'])
    expect(screen.queryByRole('button', { name: 'Load more' })).toBeNull()
    expect(fetchSorted).not.toHaveBeenCalled()
  })

  it('pages the list from Discogs until the read is whole', async () => {
    // Half read: the newest-first pages stop short
    queryClient.setQueryData(newestFirst.queryKey, {
      pages: [pageOf(RECORDS.slice(0, 1), 1, 3)],
      pageParams: [1],
    })

    renderList(BY_ARTIST)

    expect(await screen.findAllByRole('listitem')).toHaveLength(1)
    expect(fetchSorted).toHaveBeenCalledWith(BY_ARTIST, 1)
    expect(screen.getByRole('button', { name: 'Load more' })).toBeTruthy()
  })
})
