import { describe, expect, it } from 'vitest'

import { vinylColours } from '#/features/collection/vinyl-colour.utils'

import { HERO_CAST, LANDING_RECORDS, landingPressing } from './landing.content'
import { HERO_CAST_SIZE } from '../landing.timeline'

const coloursOf = (index: number) =>
  vinylColours(landingPressing(index).formats).map(
    ({ colours }) => colours[0].family,
  )

describe('HERO_CAST', () => {
  it('fills every turn of the film', () => {
    expect(HERO_CAST).toHaveLength(HERO_CAST_SIZE)
  })

  it('has a pressing for every made-up record', () => {
    for (const [index] of LANDING_RECORDS.entries())
      expect(landingPressing(index).id).toBe(104_101 + index)
  })

  it('opens on an orange disc, then a record with two discs', () => {
    expect(coloursOf(HERO_CAST[0].index)).toEqual(['orange'])
    expect(coloursOf(HERO_CAST[1].index)).toEqual(['teal', 'burgundy'])
  })

  it('gives each record of the cast its own Vinyl colour', () => {
    const firsts = HERO_CAST.map(({ index }) => coloursOf(index)[0])
    expect(new Set(firsts).size).toBe(HERO_CAST.length)
  })
})
