import { describe, expect, it } from 'vitest'

import {
  formatAmount,
  formatArtists,
  leadArtist,
  parseAmount,
} from './collection.utils'

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

describe('formatAmount', () => {
  const format = (amount: number) => formatAmount(amount, 'EUR', 'en-US')

  it('rounds amounts under 1K to whole numbers', () => {
    expect(format(850.4)).toBe('€850')
  })

  it('rounds up to 1K without a decimal', () => {
    expect(format(999.6)).toBe('€1K')
  })

  it('keeps one decimal from 1K up', () => {
    expect(format(1240.52)).toBe('€1.2K')
  })

  it('drops a zero decimal', () => {
    expect(format(1000)).toBe('€1K')
  })

  it('compacts millions', () => {
    expect(format(3_400_000)).toBe('€3.4M')
  })
})

describe('artist names', () => {
  it('drops Discogs disambiguators for display', () => {
    const artists = [{ name: 'Behemoth (3)' }, { name: 'Vargrav (3)' }]
    expect(formatArtists(artists)).toBe('Behemoth, Vargrav')
    expect(leadArtist(artists)).toBe('Behemoth')
  })

  it('has no lead artist when there are none', () => {
    expect(leadArtist([])).toBe('')
  })
})
