import { describe, expect, it } from 'vitest'

import {
  activeFilters,
  filterRecords,
  listFilterSchema,
  withoutFilter,
} from './list-filter'
import type { FilterableRecord } from './list-filter'

type Credit = { id: number; name: string; anv?: string }

let nextId = 1

const copy = ({
  artists = [],
  styles = [],
  year = 0,
  added = '2020-01-01T00:00:00-08:00',
}: {
  artists?: Credit[]
  styles?: string[]
  year?: number
  added?: string
}) => ({
  id: nextId++,
  date_added: added,
  basic_information: { artists, styles, year },
})

const ids = (records: FilterableRecord[]) => records.map((r) => r.id)

const NIRVANA = { id: 125246, name: 'Nirvana' }
const NIRVANA_UK = { id: 307513, name: 'Nirvana (2)' }
const KORN = { id: 33285, name: 'Korn' }
const VARIOUS = { id: 194, name: 'Various' }

describe('filterRecords', () => {
  it('keeps every record without filters', () => {
    const records = [copy({}), copy({})]

    expect(filterRecords(records, {})).toEqual(records)
  })

  describe('by artist', () => {
    it('matches every artist of a split', () => {
      const split = copy({ artists: [NIRVANA, KORN] })
      const records = [copy({ artists: [KORN] }), split]

      expect(ids(filterRecords(records, { artist: NIRVANA.id }))).toEqual([
        split.id,
      ])
    })

    it('matches a Name variation for the artist it stands for', () => {
      const variation = copy({ artists: [{ ...NIRVANA, anv: 'Nirvana*' }] })

      expect(ids(filterRecords([variation], { artist: NIRVANA.id }))).toEqual([
        variation.id,
      ])
    })

    it('keeps homonyms apart', () => {
      const uk = copy({ artists: [NIRVANA_UK] })
      const us = copy({ artists: [NIRVANA] })

      expect(ids(filterRecords([uk, us], { artist: NIRVANA.id }))).toEqual([
        us.id,
      ])
    })

    it('never matches Various', () => {
      const compilation = copy({ artists: [VARIOUS] })

      expect(filterRecords([compilation], { artist: VARIOUS.id })).toEqual([])
    })
  })

  it('matches a style the record carries', () => {
    const shoegaze = copy({ styles: ['Dream Pop', 'Shoegaze'] })
    const records = [copy({ styles: ['Grunge'] }), shoegaze]

    expect(ids(filterRecords(records, { style: 'Shoegaze' }))).toEqual([
      shoegaze.id,
    ])
  })

  it('matches the Pressing decade by the Release year', () => {
    const reissue = copy({ year: 2016 })
    const records = [copy({ year: 1959 }), reissue, copy({ year: 2020 })]

    expect(ids(filterRecords(records, { decade: 2010 }))).toEqual([reissue.id])
  })

  it('never matches a record with no year', () => {
    expect(filterRecords([copy({ year: 0 })], { decade: 0 })).toEqual([])
  })

  it('matches the year added, as Discogs dates it', () => {
    const newYearsEve = copy({ added: '2021-12-31T23:30:00-08:00' })
    const records = [newYearsEve, copy({ added: '2022-01-01T00:10:00-08:00' })]

    expect(ids(filterRecords(records, { added: 2021 }))).toEqual([
      newYearsEve.id,
    ])
  })

  it('combines kinds: every filter must match', () => {
    const match = copy({ styles: ['Shoegaze'], year: 1991 })
    const records = [
      copy({ styles: ['Shoegaze'], year: 2004 }),
      copy({ styles: ['Grunge'], year: 1991 }),
      match,
    ]

    expect(
      ids(filterRecords(records, { style: 'Shoegaze', decade: 1990 })),
    ).toEqual([match.id])
  })
})

describe('listFilterSchema', () => {
  it('reads every kind from search params', () => {
    expect(
      listFilterSchema.parse({
        artist: 125246,
        style: 'Shoegaze',
        decade: 1990,
        added: 2021,
      }),
    ).toEqual({ artist: 125246, style: 'Shoegaze', decade: 1990, added: 2021 })
  })

  it('reads no filter from bare search params', () => {
    expect(listFilterSchema.parse({ sort: 'year' })).toEqual({})
  })

  it('reads a numeric style as its name', () => {
    expect(listFilterSchema.parse({ style: 2 }).style).toBe('2')
  })

  it('drops values that name no filter', () => {
    expect(
      listFilterSchema.parse({
        artist: 'nirvana',
        style: '',
        decade: 1995,
        added: 0,
      }),
    ).toEqual({
      artist: undefined,
      style: undefined,
      decade: undefined,
      added: undefined,
    })
  })
})

describe('activeFilters', () => {
  it('lists active filters in kind order, labelled for chips', () => {
    expect(
      activeFilters(
        { added: 2021, decade: 1990, style: 'Shoegaze', artist: 125246 },
        'Nirvana',
      ),
    ).toEqual([
      { kind: 'artist', label: 'Nirvana' },
      { kind: 'style', label: 'Shoegaze' },
      { kind: 'decade', label: '1990s' },
      { kind: 'added', label: 'Added in 2021' },
    ])
  })

  it('lists none without filters', () => {
    expect(activeFilters({}, undefined)).toEqual([])
  })
})

describe('withoutFilter', () => {
  it('removes one kind, keeping the others', () => {
    expect(withoutFilter({ style: 'Shoegaze', decade: 1990 }, 'style')).toEqual(
      { style: undefined, decade: 1990 },
    )
  })
})
