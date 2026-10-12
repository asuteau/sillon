import { describe, expect, it } from 'vitest'

import {
  formatEstimatedValue,
  formatRecordCount,
  portraitTeaser,
} from './portrait.utils'

const VALUE = { minimum: 9100, median: 18400, maximum: 31250 }

describe('formatEstimatedValue', () => {
  it('heads with the median and gives the range alongside', () => {
    expect(formatEstimatedValue(VALUE, 'EUR', 'en-GB')).toEqual({
      median: '≈ €18.4K',
      range: '€9.1K – €31.3K',
    })
  })

  it('is null without an estimate', () => {
    expect(formatEstimatedValue(null, 'EUR', 'en-GB')).toBeNull()
  })
})

describe('formatRecordCount', () => {
  it('counts records with thousands separators', () => {
    expect(formatRecordCount(2140, 'en-GB')).toBe('2,140 records')
  })

  it('says record for a single Copy', () => {
    expect(formatRecordCount(1, 'en-GB')).toBe('1 record')
  })
})

describe('portraitTeaser', () => {
  it('joins the Estimated value and the Record count', () => {
    expect(
      portraitTeaser(
        { value: VALUE, currency: 'EUR', recordCount: 2140 },
        'en-GB',
      ),
    ).toBe('≈ €18.4K · 2,140 records')
  })

  it('leaves the value out when Discogs has no estimate', () => {
    expect(
      portraitTeaser({ value: null, currency: 'EUR', recordCount: 3 }, 'en-GB'),
    ).toBe('3 records')
  })
})
