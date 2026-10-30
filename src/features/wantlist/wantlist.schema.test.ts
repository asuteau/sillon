import { describe, expect, it } from 'vitest'

import { WantlistItemSchema } from './wantlist.schema'

// A Wantlist entry as Discogs returns it, trimmed to the fields Sillon reads
const WANT = {
  id: 2242413,
  date_added: '2021-03-14T09:21:07-07:00',
  basic_information: {
    master_id: 13814,
    title: 'Loveless',
    year: 1991,
    artists: [{ id: 6464, name: 'My Bloody Valentine', anv: '', join: '' }],
    cover_image: 'https://i.discogs.com/cover.jpg',
    thumb: 'https://i.discogs.com/thumb.jpg',
    styles: ['Shoegaze'],
    formats: [{ name: 'Vinyl', qty: '1', descriptions: ['LP', 'Album'] }],
    labels: [{ name: 'Creation Records', catno: 'CRELP 060' }],
  },
}

describe('WantlistItemSchema', () => {
  it('keeps artist IDs: the artist filter tells artists apart by them', () => {
    expect(
      WantlistItemSchema.parse(WANT).basic_information.artists,
    ).toMatchObject([{ id: 6464, name: 'My Bloody Valentine' }])
  })
})
