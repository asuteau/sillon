import { describe, expect, it } from 'vitest'

import { parseAmount } from './collection.utils'

describe('parseAmount', () => {
  it('parses a Discogs amount with thousands and cents', () => {
    expect(parseAmount('€1,240.52')).toBe(1240.52)
  })

  it('parses comma decimals', () => {
    expect(parseAmount('1.240,52 €')).toBe(1240.52)
  })

  it('treats a three-digit group as thousands, not decimals', () => {
    expect(parseAmount('¥12,345')).toBe(12345)
  })

  it('parses zero', () => {
    expect(parseAmount('€0.00')).toBe(0)
  })

  it('returns null when there is no number', () => {
    expect(parseAmount('')).toBeNull()
  })
})
