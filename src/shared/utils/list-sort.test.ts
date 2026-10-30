import { describe, expect, it } from 'vitest'

import { sortRecords } from './list-sort'

const record = (
  id: number,
  {
    artist = 'Korn',
    title = 'Untitled',
    year = 2000,
    added = '2020-01-01T00:00:00-08:00',
  }: { artist?: string; title?: string; year?: number; added?: string },
) => ({
  id,
  date_added: added,
  basic_information: { title, year, artists: [{ name: artist }] },
})

const ids = (records: { id: number }[]) => records.map((r) => r.id)

describe('sortRecords', () => {
  it('sorts by date added, newest first by default order', () => {
    const records = [
      record(1, { added: '2021-03-01T10:00:00-08:00' }),
      record(2, { added: '2024-06-01T10:00:00-08:00' }),
      record(3, { added: '2019-01-01T10:00:00-08:00' }),
    ]

    expect(ids(sortRecords(records, { sort: 'added', order: 'desc' }))).toEqual(
      [2, 1, 3],
    )
    expect(ids(sortRecords(records, { sort: 'added', order: 'asc' }))).toEqual([
      3, 1, 2,
    ])
  })

  it('sorts by artist A→Z, ignoring Discogs disambiguators', () => {
    const records = [
      record(1, { artist: 'Nirvana (2)' }),
      record(2, { artist: 'Air' }),
      record(3, { artist: 'Nina Simone' }),
    ]

    expect(ids(sortRecords(records, { sort: 'artist', order: 'asc' }))).toEqual(
      [2, 3, 1],
    )
  })

  it('sorts by title', () => {
    const records = [
      record(1, { title: 'Nevermind' }),
      record(2, { title: 'Bleach' }),
    ]

    expect(ids(sortRecords(records, { sort: 'title', order: 'asc' }))).toEqual([
      2, 1,
    ])
  })

  it('sorts by year, keeping the given order between ties', () => {
    const records = [
      record(1, { year: 1991 }),
      record(2, { year: 2016 }),
      record(3, { year: 1991 }),
    ]

    expect(ids(sortRecords(records, { sort: 'year', order: 'desc' }))).toEqual([
      2, 1, 3,
    ])
    expect(ids(sortRecords(records, { sort: 'year', order: 'asc' }))).toEqual([
      1, 3, 2,
    ])
  })
})
