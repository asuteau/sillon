import { describe, expect, it } from 'vitest'

import { listFilterOptions, searchArtists } from './filter-options'

const NIRVANA = { id: 125246, name: 'Nirvana' }
const KORN = { id: 33285, name: 'Korn' }

let nextId = 1

const record = ({
  artists = [NIRVANA],
  styles = ['Grunge'],
  year = 1991,
  added = 2021,
}: {
  artists?: { id: number; name: string; anv?: string }[]
  styles?: string[]
  year?: number
  added?: number
} = {}) => ({
  id: nextId++,
  date_added: `${added}-03-01T10:00:00-08:00`,
  basic_information: { year, styles, artists },
})

describe('listFilterOptions', () => {
  it('counts each value of each kind present in the list', () => {
    const options = listFilterOptions(
      [
        record(),
        record({ year: 1989, added: 2022 }),
        record({ artists: [KORN], styles: ['Nu Metal'], year: 1999 }),
      ],
      {},
    )

    expect(options.artist).toEqual([
      { value: NIRVANA.id, label: 'Nirvana', count: 2, names: ['Nirvana'] },
      { value: KORN.id, label: 'Korn', count: 1, names: ['Korn'] },
    ])
    expect(options.style).toEqual([
      { value: 'Grunge', label: 'Grunge', count: 2 },
      { value: 'Nu Metal', label: 'Nu Metal', count: 1 },
    ])
    expect(options.decade).toEqual([
      { value: 1990, label: '1990s', count: 2 },
      { value: 1980, label: '1980s', count: 1 },
    ])
    expect(options.added).toEqual([
      { value: 2022, label: '2022', count: 1 },
      { value: 2021, label: '2021', count: 2 },
    ])
  })

  it('narrows each kind by the other active filters, not its own', () => {
    const options = listFilterOptions(
      [
        record({ styles: ['Grunge'] }),
        record({ styles: ['Grunge', 'Noise'], year: 1989 }),
        record({ artists: [KORN], styles: ['Nu Metal'], year: 1999 }),
      ],
      { style: 'Grunge' },
    )

    // Korn has no Grunge record: picking it could only give an empty list
    expect(options.artist.map((v) => v.label)).toEqual(['Nirvana'])
    expect(options.decade).toEqual([
      { value: 1990, label: '1990s', count: 1 },
      { value: 1980, label: '1980s', count: 1 },
    ])
    // Its own kind ignores the style picked, so another can replace it
    expect(options.style).toEqual([
      { value: 'Grunge', label: 'Grunge', count: 2 },
      { value: 'Noise', label: 'Noise', count: 1 },
      { value: 'Nu Metal', label: 'Nu Metal', count: 1 },
    ])
  })

  it('orders by count, ties A→Z; decades and years newest first', () => {
    const options = listFilterOptions(
      [
        record({ styles: ['Shoegaze'], year: 1971, added: 2019 }),
        record({ styles: ['Dream Pop'], year: 2016, added: 2024 }),
        record({ styles: ['Shoegaze'], year: 1971, added: 2019 }),
        record({ styles: ['Ambient'], year: 1994, added: 2020 }),
      ],
      {},
    )

    expect(options.style.map((v) => v.label)).toEqual([
      'Shoegaze',
      'Ambient',
      'Dream Pop',
    ])
    expect(options.decade.map((v) => v.value)).toEqual([2010, 1990, 1970])
    expect(options.added.map((v) => v.value)).toEqual([2024, 2020, 2019])
  })

  it('matches artists as Top artists: by ID, Name variations, splits', () => {
    const SPLIT = [
      { id: 1, name: 'Mogwai' },
      { id: 2, name: 'Bardo Pond' },
    ]
    const options = listFilterOptions(
      [
        record({ artists: [{ id: 3, name: 'Nirvana (2)' }] }),
        record({ artists: [NIRVANA] }),
        record({ artists: [{ ...NIRVANA, anv: 'Nirvana UK' }, NIRVANA] }),
        record({ artists: SPLIT }),
        record({ artists: [{ id: 194, name: 'Various' }] }),
      ],
      {},
    )

    expect(options.artist).toEqual([
      {
        value: NIRVANA.id,
        label: 'Nirvana',
        count: 2,
        names: ['Nirvana', 'Nirvana UK'],
      },
      { value: 2, label: 'Bardo Pond', count: 1, names: ['Bardo Pond'] },
      { value: 1, label: 'Mogwai', count: 1, names: ['Mogwai'] },
      { value: 3, label: 'Nirvana', count: 1, names: ['Nirvana'] },
    ])
  })

  it('leaves the no-year bucket out of decades', () => {
    const options = listFilterOptions([record({ year: 0 }), record()], {})

    expect(options.decade).toEqual([{ value: 1990, label: '1990s', count: 1 }])
  })

  it('keeps an active value listed even when nothing matches it any more', () => {
    const records = [record({ styles: ['Grunge'] })]

    expect(listFilterOptions(records, { style: 'Shoegaze' }).style).toEqual([
      { value: 'Grunge', label: 'Grunge', count: 1 },
      { value: 'Shoegaze', label: 'Shoegaze', count: 0 },
    ])
    expect(listFilterOptions(records, { artist: 999 }).artist).toEqual([
      { value: NIRVANA.id, label: 'Nirvana', count: 1, names: ['Nirvana'] },
      { value: 999, label: 'Artist', count: 0, names: [] },
    ])
  })
})

describe('searchArtists', () => {
  const ARTISTS = [
    { value: 1, label: 'Sigur Rós', count: 3, names: ['Sigur Rós'] },
    { value: 2, label: 'Beatles', count: 2, names: ['Beatles', 'ビートルズ'] },
    { value: 3, label: 'Slowdive', count: 1, names: ['Slowdive'] },
  ]

  it('keeps every artist for an empty query', () => {
    expect(searchArtists(ARTISTS, '  ')).toBe(ARTISTS)
  })

  it('matches any credited name, ignoring case and accents', () => {
    expect(searchArtists(ARTISTS, 'ros').map((a) => a.value)).toEqual([1])
    expect(searchArtists(ARTISTS, 'SLOW').map((a) => a.value)).toEqual([3])
    expect(searchArtists(ARTISTS, 'ビート').map((a) => a.value)).toEqual([2])
  })
})
