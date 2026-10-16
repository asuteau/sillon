import { describe, expect, it } from 'vitest'

import { toReleaseMatch } from './scan.model'

describe('a barcode match as a release', () => {
  it('reads artist, title and the details that tell Releases apart', () => {
    expect(
      toReleaseMatch({
        id: 42,
        master_id: 7,
        title: 'Slowdive (2) - Souvlaki',
        year: '1993',
        country: 'UK',
        label: ['Creation Records', 'Creation Records'],
        catno: 'CRE LP 139',
        formats: [
          {
            name: 'Vinyl',
            qty: '1',
            descriptions: ['LP', 'Album'],
            text: 'Blue',
          },
        ],
        user_data: { in_collection: true, in_wantlist: false },
      }),
    ).toEqual({
      id: 42,
      masterId: 7,
      artist: 'Slowdive',
      credits: ['Slowdive'],
      title: 'Souvlaki',
      year: 1993,
      country: 'UK',
      label: 'Creation Records',
      catno: 'CRE LP 139',
      format: 'Vinyl · LP · Album · Blue',
      inCollection: true,
      inWantlist: false,
    })
  })

  it("leaves out what Discogs doesn't know", () => {
    expect(
      toReleaseMatch({ id: 1, title: 'Untitled', catno: 'none' }),
    ).toMatchObject({
      masterId: null,
      artist: '',
      credits: [],
      title: 'Untitled',
      year: 0,
      country: null,
      label: null,
      catno: null,
      format: null,
      inCollection: false,
      inWantlist: false,
    })
  })
})
