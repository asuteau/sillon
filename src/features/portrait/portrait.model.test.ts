import { describe, expect, it } from 'vitest'

import type { CollectionListPage } from '#/features/collection/collection.queries'
import type { CollectionRelease } from '#/features/collection/collection.schema'

import {
  additionsByYear,
  pressingDecades,
  scanProgress,
  topArtists,
  topStyles,
} from './portrait.model'

type Credit = { id: number; name: string; anv?: string }

let nextInstance = 1

const copy = ({
  artists = [],
  styles = [],
  year = 0,
  added = '2020-01-01T00:00:00-08:00',
  instanceId = nextInstance++,
}: {
  artists?: Credit[]
  styles?: string[]
  year?: number
  added?: string
  instanceId?: number
}) =>
  ({
    id: instanceId,
    instance_id: instanceId,
    date_added: added,
    basic_information: { artists, styles, year },
  }) as unknown as CollectionRelease

const times = (n: number, make: () => CollectionRelease) =>
  Array.from({ length: n }, make)

const NIRVANA = { id: 125246, name: 'Nirvana' }
const NIRVANA_UK = { id: 307513, name: 'Nirvana (2)' }
const KORN = { id: 33285, name: 'Korn' }
const VARIOUS = { id: 194, name: 'Various' }

describe('topArtists', () => {
  it('ranks artists by Copies', () => {
    const copies = [
      ...times(2, () => copy({ artists: [KORN] })),
      ...times(3, () => copy({ artists: [NIRVANA] })),
    ]

    expect(topArtists(copies)).toEqual([
      { id: NIRVANA.id, name: 'Nirvana', copies: 3 },
      { id: KORN.id, name: 'Korn', copies: 2 },
    ])
  })

  it('counts every artist of a split', () => {
    const copies = [
      copy({ artists: [NIRVANA, KORN] }),
      copy({ artists: [NIRVANA] }),
      copy({ artists: [KORN] }),
    ]

    expect(topArtists(copies)).toEqual([
      { id: KORN.id, name: 'Korn', copies: 2 },
      { id: NIRVANA.id, name: 'Nirvana', copies: 2 },
    ])
  })

  it('merges Name variations into the artist they stand for', () => {
    const copies = [
      copy({ artists: [KORN] }),
      copy({ artists: [{ ...KORN, anv: 'KoЯn' }] }),
    ]

    expect(topArtists(copies)).toEqual([
      { id: KORN.id, name: 'Korn', copies: 2 },
    ])
  })

  it('keeps homonyms apart and drops the disambiguator', () => {
    const copies = [
      ...times(3, () => copy({ artists: [NIRVANA] })),
      ...times(2, () => copy({ artists: [NIRVANA_UK] })),
    ]

    expect(topArtists(copies)).toEqual([
      { id: NIRVANA.id, name: 'Nirvana', copies: 3 },
      { id: NIRVANA_UK.id, name: 'Nirvana', copies: 2 },
    ])
  })

  it('leaves Various out', () => {
    const copies = times(3, () => copy({ artists: [VARIOUS] }))

    expect(topArtists(copies)).toEqual([])
  })

  it('counts each owned Copy, but a Copy read twice once', () => {
    const twice = copy({ artists: [KORN] })
    const copies = [
      twice,
      twice,
      // The same Release owned again: another Copy
      { ...twice, instance_id: 9999 },
      copy({ artists: [NIRVANA] }),
      copy({ artists: [NIRVANA] }),
    ]

    expect(topArtists(copies)).toEqual([
      { id: KORN.id, name: 'Korn', copies: 2 },
      { id: NIRVANA.id, name: 'Nirvana', copies: 2 },
    ])
  })

  it('counts an artist credited twice on one Copy once', () => {
    const copies = times(2, () => copy({ artists: [KORN, KORN] }))

    expect(topArtists(copies)).toEqual([
      { id: KORN.id, name: 'Korn', copies: 2 },
    ])
  })

  it('never lists an artist with a single Copy', () => {
    const copies = [
      copy({ artists: [NIRVANA] }),
      ...times(2, () => copy({ artists: [KORN] })),
    ]

    expect(topArtists(copies)).toEqual([
      { id: KORN.id, name: 'Korn', copies: 2 },
    ])
  })

  it('is empty when no artist has two Copies', () => {
    const copies = [copy({ artists: [NIRVANA] }), copy({ artists: [KORN] })]

    expect(topArtists(copies)).toEqual([])
  })

  it('keeps the ten first, ties A→Z', () => {
    const names = 'LKJIHGFEDCBA'.split('')
    const copies = names.flatMap((name, index) =>
      times(2, () => copy({ artists: [{ id: index + 1, name }] })),
    )

    expect(topArtists(copies).map((artist) => artist.name)).toEqual(
      'ABCDEFGHIJ'.split(''),
    )
  })
})

describe('topStyles', () => {
  it('ranks styles by Copies, ties A→Z', () => {
    const copies = [
      copy({ styles: ['Shoegaze', 'Dream Pop'] }),
      copy({ styles: ['Shoegaze'] }),
      copy({ styles: ['Hard Bop'] }),
    ]

    expect(topStyles(copies)).toEqual([
      { name: 'Shoegaze', copies: 2 },
      { name: 'Dream Pop', copies: 1 },
      { name: 'Hard Bop', copies: 1 },
    ])
  })

  it('counts a Copy once per style', () => {
    const copies = [copy({ styles: ['Shoegaze', 'Shoegaze'] })]

    expect(topStyles(copies)).toEqual([{ name: 'Shoegaze', copies: 1 }])
  })

  it('skips Copies with no styles', () => {
    const copies = [copy({ styles: [] }), copy({ styles: ['Hard Bop'] })]

    expect(topStyles(copies)).toEqual([{ name: 'Hard Bop', copies: 1 }])
  })

  it('counts a Copy read twice once', () => {
    const twice = copy({ styles: ['Hard Bop'] })

    expect(topStyles([twice, twice])).toEqual([{ name: 'Hard Bop', copies: 1 }])
  })

  it('keeps the ten first', () => {
    const copies = 'ABCDEFGHIJKL'
      .split('')
      .map((name) => copy({ styles: [name] }))

    expect(topStyles(copies)).toHaveLength(10)
  })
})

const pageOf = (
  page: number,
  pages: number,
  items: number,
  releases: number,
): CollectionListPage => ({
  releases: times(releases, () => copy({})),
  pagination: { page, pages, items },
  fetchedAt: 0,
})

describe('scanProgress', () => {
  it('knows nothing before the first page', () => {
    expect(scanProgress(undefined)).toEqual({
      read: 0,
      total: undefined,
      requestsLeft: undefined,
      isComplete: false,
      hasGap: false,
    })
  })

  it('counts the Copies read so far', () => {
    const data = { pages: [pageOf(1, 3, 250, 100)], pageParams: [1] }

    expect(scanProgress(data)).toEqual({
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

    expect(scanProgress(data)).toEqual({
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

    expect(scanProgress(data)).toMatchObject({ read: 149, isComplete: false })
  })

  it('has a gap when the last page is read but a Copy was skipped', () => {
    // A Copy removed mid-scan: Discogs' later pages shift by one
    const data = {
      pages: [pageOf(1, 2, 150, 99), pageOf(2, 2, 150, 50)],
      pageParams: [1, 2],
    }

    expect(scanProgress(data)).toEqual({
      read: 149,
      total: 150,
      requestsLeft: 0,
      isComplete: false,
      hasGap: true,
    })
  })
})

describe('pressingDecades', () => {
  it('counts Copies per decade of the Release year', () => {
    const copies = [
      copy({ year: 1991 }),
      copy({ year: 1999 }),
      copy({ year: 2016 }),
    ]

    expect(pressingDecades(copies)).toEqual({
      decades: [
        { decade: 1990, copies: 2 },
        { decade: 2000, copies: 0 },
        { decade: 2010, copies: 1 },
      ],
      noYear: 0,
    })
  })

  it('leaves no-year Copies out and counts them apart', () => {
    const copies = [copy({ year: 1975 }), copy({ year: 0 }), copy({ year: 0 })]

    expect(pressingDecades(copies)).toEqual({
      decades: [{ decade: 1970, copies: 1 }],
      noYear: 2,
    })
  })

  it('has no decades when no Copy has a year', () => {
    expect(pressingDecades([copy({ year: 0 })])).toEqual({
      decades: [],
      noYear: 1,
    })
  })

  it('counts a Copy read twice once', () => {
    const copies = [
      copy({ year: 1991, instanceId: 7 }),
      copy({ year: 1991, instanceId: 7 }),
    ]

    expect(pressingDecades(copies).decades).toEqual([
      { decade: 1990, copies: 1 },
    ])
  })
})

describe('additionsByYear', () => {
  it('counts Copies per year added, gaps as zero', () => {
    const copies = [
      copy({ added: '2026-03-04T10:00:00-07:00' }),
      copy({ added: '2023-12-31T23:59:59-08:00' }),
      copy({ added: '2023-01-01T00:00:00-08:00' }),
    ]

    expect(additionsByYear(copies)).toEqual([
      { year: 2023, copies: 2 },
      { year: 2024, copies: 0 },
      { year: 2025, copies: 0 },
      { year: 2026, copies: 1 },
    ])
  })

  it('is empty for no Copies', () => {
    expect(additionsByYear([])).toEqual([])
  })
})
