import { describe, expect, it } from 'vitest'

import { formatEstimatedValue, formatRecords } from './portrait.utils'

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

describe('formatRecords', () => {
  it('says record for one, records otherwise', () => {
    expect(formatRecords(1)).toBe('1 record')
    expect(formatRecords(0)).toBe('0 records')
    expect(formatRecords(2140)).toBe(`${(2140).toLocaleString()} records`)
  })
})
