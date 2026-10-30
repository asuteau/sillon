import { describe, expect, it } from 'vitest'

import { readProgress } from './full-read'

// A list record keyed by its own ID, as a Want is; Copies key by instance
type Item = { key: number }

let nextKey = 1

const pageOf = (page: number, pages: number, items: number, count: number) => ({
  items: Array.from({ length: count }, (): Item => ({ key: nextKey++ })),
  pagination: { page, pages, items },
})

const reader = {
  recordsOf: (page: ReturnType<typeof pageOf>) => page.items,
  keyOf: (item: Item) => item.key,
}

describe('readProgress', () => {
  it('knows nothing before the first page', () => {
    expect(readProgress(undefined, reader)).toEqual({
      read: 0,
      total: undefined,
      requestsLeft: undefined,
      isComplete: false,
      hasGap: false,
    })
  })

  it('counts the records read so far', () => {
    expect(readProgress([pageOf(1, 3, 250, 100)], reader)).toEqual({
      read: 100,
      total: 250,
      requestsLeft: 2,
      isComplete: false,
      hasGap: false,
    })
  })

  it('is complete once every record is read', () => {
    const pages = [pageOf(1, 2, 150, 100), pageOf(2, 2, 150, 50)]

    expect(readProgress(pages, reader)).toEqual({
      read: 150,
      total: 150,
      requestsLeft: 0,
      isComplete: true,
      hasGap: false,
    })
  })

  it('is complete after one page for a short list', () => {
    expect(readProgress([pageOf(1, 1, 42, 42)], reader)).toMatchObject({
      read: 42,
      isComplete: true,
    })
  })

  it('counts a record read twice once', () => {
    const page1 = pageOf(1, 2, 150, 100)
    const page2 = pageOf(2, 2, 150, 49)
    const pages = [page1, { ...page2, items: [...page2.items, page1.items[0]] }]

    expect(readProgress(pages, reader)).toMatchObject({
      read: 149,
      isComplete: false,
    })
  })

  it('has a gap when the last page is read but a record was skipped', () => {
    // A record removed mid-read: Discogs' later pages shift by one
    const pages = [pageOf(1, 2, 150, 99), pageOf(2, 2, 150, 50)]

    expect(readProgress(pages, reader)).toEqual({
      read: 149,
      total: 150,
      requestsLeft: 0,
      isComplete: false,
      hasGap: true,
    })
  })
})
