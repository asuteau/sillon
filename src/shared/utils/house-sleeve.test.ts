import { describe, expect, it } from 'vitest'

import {
  SLEEVE_COMPOSITIONS,
  SLEEVE_LAYOUTS,
  SLEEVE_PLACEMENTS,
  houseSleeve,
} from './house-sleeve'

const records = Array.from({ length: 40 }, (_, i) => ({
  artist: `Artist ${i}`,
  title: `Title ${i * 7}`,
}))

describe('houseSleeve', () => {
  it('gives the same design for the same record', () => {
    const record = {
      artist: 'Alice Coltrane',
      title: 'Journey in Satchidananda',
    }
    expect(houseSleeve(record)).toEqual(houseSleeve({ ...record }))
  })

  it('ignores case, spacing and Discogs disambiguators', () => {
    expect(
      houseSleeve({ artist: 'Nirvana (2)', title: ' Nevermind ' }),
    ).toEqual(houseSleeve({ artist: 'nirvana', title: 'NEVERMIND' }))
  })

  it('varies the layout and composition across records', () => {
    const designs = records.map(houseSleeve)
    const layouts = new Set(designs.map((d) => d.layout))
    const compositions = new Set(designs.map((d) => d.composition.name))
    expect(layouts.size).toBeGreaterThan(SLEEVE_LAYOUTS.length / 2)
    expect(compositions.size).toBeGreaterThan(SLEEVE_COMPOSITIONS.length / 2)
  })

  it('swaps artist and title into different designs', () => {
    const differing = records.filter(
      ({ artist, title }) =>
        JSON.stringify(houseSleeve({ artist, title })) !==
        JSON.stringify(houseSleeve({ artist: title, title: artist })),
    )
    expect(differing.length).toBeGreaterThan(records.length / 2)
  })

  it('only picks from the known set', () => {
    for (const design of records.map(houseSleeve)) {
      expect(SLEEVE_LAYOUTS).toContain(design.layout)
      expect(SLEEVE_COMPOSITIONS).toContainEqual(design.composition)
      expect(SLEEVE_PLACEMENTS).toContain(design.placement)
    }
  })

  it('keys by the cover key when given, so every Release of a Master matches', () => {
    expect(
      houseSleeve({ artist: 'Can', title: 'Tago Mago', coverKey: 'master:1' }),
    ).toEqual(
      houseSleeve({
        artist: 'Can',
        title: 'Tago Mago (Remastered)',
        coverKey: 'master:1',
      }),
    )
  })

  it('gives same-titled records with different cover keys their own designs', () => {
    const differing = records.filter(
      ({ artist, title }, i) =>
        JSON.stringify(
          houseSleeve({ artist, title, coverKey: `release:${i}` }),
        ) !==
        JSON.stringify(
          houseSleeve({ artist, title, coverKey: `release:${i + 1000}` }),
        ),
    )
    expect(differing.length).toBeGreaterThan(records.length / 2)
  })
})
