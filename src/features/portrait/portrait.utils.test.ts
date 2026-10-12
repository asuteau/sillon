import { describe, expect, it } from 'vitest'

import { formatEstimatedValue } from './portrait.utils'

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
