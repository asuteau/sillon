import { describe, expect, it } from 'vitest'

import { formatPrice } from './marketplace.utils'

const eur = (value: number) => ({ currency: 'EUR', value })

describe('formatPrice', () => {
  it('shows cents when there are some', () => {
    expect(formatPrice(eur(14.5), 'en-US')).toBe('€14.50')
  })

  it('omits cents on whole amounts', () => {
    expect(formatPrice(eur(8), 'en-US')).toBe('€8')
  })
})
