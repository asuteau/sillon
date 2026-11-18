import { describe, expect, it } from 'vitest'

import { vinylColours } from '#/features/collection/vinyl-colour.utils'

import { HERO_RECORD } from './hero.content'
import { LANDING_RECORDS, landingPressing } from './landing.content'

describe('LANDING_RECORDS', () => {
  it('has a pressing for every made-up record', () => {
    for (const [index] of LANDING_RECORDS.entries())
      expect(landingPressing(index).id).toBe(104_101 + index)
  })
})

describe('the hero record', () => {
  it('comes out in an orange disc, read from its Discogs formats', () => {
    const [disc] = vinylColours(HERO_RECORD.pressing.formats)
    expect(disc.colours[0].family).toBe('orange')
  })
})
