import { describe, expect, it } from 'vitest'

import { toSearchRecord } from './search.model'

describe('toSearchRecord', () => {
  it('keeps what the Record screen shows, nulls dropped', () => {
    const record = toSearchRecord({
      id: 1,
      master_id: 2,
      title: 'Loveless',
      year: 1991,
      country: 'UK',
      artists: [{ name: 'My Bloody Valentine' }],
      styles: ['Shoegaze'],
      formats: [
        { name: 'Vinyl', qty: '1', descriptions: ['LP'], text: 'Red' },
        { name: 'CD', qty: null, descriptions: null, text: null },
      ],
      labels: [{ name: 'Creation Records', catno: 'CRELP 060' }],
    })

    expect(record).toEqual({
      id: 1,
      basic_information: {
        master_id: 2,
        title: 'Loveless',
        year: 1991,
        country: 'UK',
        artists: [{ name: 'My Bloody Valentine' }],
        styles: ['Shoegaze'],
        formats: [
          { name: 'Vinyl', qty: '1', descriptions: ['LP'], text: 'Red' },
          { name: 'CD' },
        ],
        labels: [{ name: 'Creation Records', catno: 'CRELP 060' }],
      },
    })
  })

  it('has no date added: a search result is not a Copy', () => {
    const record = toSearchRecord({
      id: 1,
      title: 'Untitled',
      year: 0,
      artists: [{ name: 'Someone' }],
    })

    expect(record.date_added).toBeUndefined()
    expect(record.basic_information.master_id).toBeUndefined()
    expect(record.basic_information.formats).toEqual([])
    expect(record.basic_information.labels).toEqual([])
  })
})
