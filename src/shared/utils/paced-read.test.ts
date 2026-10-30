import { describe, expect, it } from 'vitest'

import { nextReadDelay } from './paced-read'

describe('nextReadDelay', () => {
  it('waits out the pace after the last Discogs fetch', () => {
    expect(nextReadDelay(10_000, 10_500)).toBe(1000)
  })

  it('reads at once when the last page is older than the pace', () => {
    expect(nextReadDelay(0, 60_000)).toBe(0)
  })
})
