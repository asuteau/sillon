// @vitest-environment jsdom
import {
  infiniteQueryOptions,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useFullListRead } from './use-full-list-read'

type Want = { id: number }
type WantsPage = {
  wants: Want[]
  pagination: { page: number; pages: number; items: number }
  fetchedAt: number
}

// 5 wants, 2 a page; fetched long ago, so the pace never waits
const WANTS = [1, 2, 3, 4, 5].map((id) => ({ id }))
const PER_PAGE = 2
const PAGES = Math.ceil(WANTS.length / PER_PAGE)

const wantsOptions = (fetchPage: (page: number) => Promise<WantsPage>) =>
  infiniteQueryOptions({
    queryKey: ['wants'],
    queryFn: ({ pageParam }) => fetchPage(pageParam),
    initialPageParam: 1,
    getNextPageParam: (last: WantsPage) =>
      last.pagination.page < last.pagination.pages
        ? last.pagination.page + 1
        : undefined,
  })

const pageOf = async (page: number): Promise<WantsPage> => ({
  wants: WANTS.slice((page - 1) * PER_PAGE, page * PER_PAGE),
  pagination: { page, pages: PAGES, items: WANTS.length },
  fetchedAt: 0,
})

const reader = {
  recordsOf: (page: WantsPage) => page.wants,
  keyOf: (want: Want) => want.id,
}

// A fresh cache per test, kept across the test's renders
let queryClient: QueryClient
beforeEach(() => {
  queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
})

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
)

describe('useFullListRead', () => {
  it('reads every page, then gives the whole list at once', async () => {
    const fetchPage = vi.fn(pageOf)
    const seen: string[] = []
    const { result } = renderHook(
      () => {
        const value = useFullListRead(wantsOptions(fetchPage), reader, true)
        seen.push(value.read.status)
        return value
      },
      { wrapper },
    )

    await waitFor(() => expect(result.current.read.status).toBe('read'))

    expect(fetchPage).toHaveBeenCalledTimes(PAGES)
    expect(result.current.read).toEqual({ status: 'read', records: WANTS })
    // Never partial: reading until the last page, then read
    expect(
      seen.slice(0, seen.indexOf('read')).every((s) => s === 'reading'),
    ).toBe(true)
  })

  it('asks nothing until enabled', async () => {
    const fetchPage = vi.fn(pageOf)
    renderHook(() => useFullListRead(wantsOptions(fetchPage), reader, false), {
      wrapper,
    })

    await new Promise((resolve) => setTimeout(resolve, 20))
    expect(fetchPage).not.toHaveBeenCalled()
  })

  it('fails with how far it read, and retries from there', async () => {
    let failPage2 = true
    const fetchPage = vi.fn(async (page: number) => {
      if (page === 2 && failPage2) throw new Error('Discogs down')
      return pageOf(page)
    })
    const { result } = renderHook(
      () => useFullListRead(wantsOptions(fetchPage), reader, true),
      { wrapper },
    )

    await waitFor(() => expect(result.current.read.status).toBe('failed'))
    expect(result.current.read).toMatchObject({ read: 2, total: 5 })

    failPage2 = false
    result.current.retry()

    await waitFor(() => expect(result.current.read.status).toBe('read'))
    expect(fetchPage.mock.calls.map(([page]) => page)).toEqual([1, 2, 2, 3])
  })
})
