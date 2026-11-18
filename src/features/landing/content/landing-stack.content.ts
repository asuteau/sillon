import type { ReleaseMatch, Stack } from '#/features/scan/stack.model'

import { landingRecords } from './landing.content'
import type { LandingRecord } from './landing.content'

// The Scan still's Stack: made-up records, three sleeves scanned in one go

const match = (
  id: number,
  { artist, title, year, label, catno }: LandingRecord,
  country: string,
): ReleaseMatch => ({
  id,
  masterId: null,
  artist,
  credits: [artist],
  title,
  year,
  country,
  label,
  catno,
  format: 'Vinyl',
  inCollection: false,
  inWantlist: false,
})

const [OUTER_EDGE, PAPER_MOONS, SLOW_ARCS] = landingRecords(6, 8, 5)

export const LANDING_STACK: Stack = {
  records: [
    {
      barcode: '5012394144772',
      status: 'found',
      matches: [match(1, OUTER_EDGE, 'Sweden')],
      chosenId: 1,
      included: false,
    },
    // Unresolved: one barcode, several pressings, none chosen yet
    {
      barcode: '0602537384451',
      status: 'found',
      matches: [
        match(2, PAPER_MOONS, 'France'),
        match(3, PAPER_MOONS, 'UK'),
        match(4, PAPER_MOONS, 'Germany'),
      ],
      chosenId: null,
      included: false,
    },
    {
      barcode: '4050538263170',
      status: 'found',
      matches: [match(5, SLOW_ARCS, 'UK')],
      chosenId: 5,
      included: false,
    },
  ],
  notFound: [],
}

// The Scan loop's sleeves, one per pass: each scanned alone (a Stack of one)
// and found on Discogs as one release. The first goes to the Collection, the
// second to the Wantlist. By LANDING_RECORDS index
export const SCAN_LOOP_SLEEVES = [
  { index: 0, barcode: '5021732098143', country: 'UK' },
  { index: 3, barcode: '0731454386722', country: 'US' },
] as const

// The crate's back sleeves, never lifted
export const SCAN_LOOP_CRATE = [7, 1] as const

export const scanLoopStack = (pass: 0 | 1): Stack => {
  const { index, barcode, country } = SCAN_LOOP_SLEEVES[pass]
  const [record] = landingRecords(index)
  const id = 10 + pass
  return {
    records: [
      {
        barcode,
        status: 'found',
        matches: [match(id, record, country)],
        chosenId: id,
        included: false,
      },
    ],
    notFound: [],
  }
}
