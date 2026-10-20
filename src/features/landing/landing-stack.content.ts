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
