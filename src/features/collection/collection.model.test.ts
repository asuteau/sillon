import { describe, expect, it } from 'vitest'

import type { CollectionListPage } from './collection.queries'
import type { CollectionRelease } from './collection.schema'

import { readProgress } from './collection.model'

let nextInstance = 1

const copy = () => {
  const instanceId = nextInstance++
  return { id: instanceId, instance_id: instanceId } as CollectionRelease
}

const times = (n: number, make: () => CollectionRelease) =>
  Array.from({ length: n }, make)

const pageOf = (
  page: number,
  pages: number,
  items: number,
  releases: number,
): CollectionListPage => ({
  releases: times(releases, () => copy()),
  pagination: { page, pages, items },
  fetchedAt: 0,
})

describe('readProgress', () => {
  it('knows nothing before the first page', () => {
    expect(readProgress(undefined)).toEqual({
      read: 0,
      total: undefined,
      requestsLeft: undefined,
      isComplete: false,
      hasGap: false,
    })
  })

  it('counts the Copies read so far', () => {
    const data = { pages: [pageOf(1, 3, 250, 100)], pageParams: [1] }

    expect(readProgress(data)).toEqual({
      read: 100,
      total: 250,
      requestsLeft: 2,
      isComplete: false,
      hasGap: false,
    })
  })

  it('is complete once every Copy is read', () => {
    const data = {
      pages: [pageOf(1, 2, 150, 100), pageOf(2, 2, 150, 50)],
      pageParams: [1, 2],
    }

    expect(readProgress(data)).toEqual({
      read: 150,
      total: 150,
      requestsLeft: 0,
      isComplete: true,
      hasGap: false,
    })
  })

  it('counts a Copy read twice once', () => {
    const page1 = pageOf(1, 2, 150, 100)
    const data = {
      pages: [
        page1,
        {
          ...pageOf(2, 2, 150, 49),
          releases: [...pageOf(2, 2, 150, 49).releases, page1.releases[0]],
        },
      ],
      pageParams: [1, 2],
    }

    expect(readProgress(data)).toMatchObject({ read: 149, isComplete: false })
  })

  it('has a gap when the last page is read but a Copy was skipped', () => {
    // A Copy removed mid-scan: Discogs' later pages shift by one
    const data = {
      pages: [pageOf(1, 2, 150, 99), pageOf(2, 2, 150, 50)],
      pageParams: [1, 2],
    }

    expect(readProgress(data)).toEqual({
      read: 149,
      total: 150,
      requestsLeft: 0,
      isComplete: false,
      hasGap: true,
    })
  })
})
