import { describe, expect, it } from 'vitest'

import { playheadAt } from './film/film.model'
import { WANTLIST_BEATS, WANTLIST_SCORE } from './wantlist.score'
import type { WantlistTrack } from './wantlist.score'

const look = (name: WantlistTrack, ms: number) =>
  WANTLIST_SCORE.sample(ms)[name] ?? {}
const opacity = (name: WantlistTrack, ms: number) => look(name, ms).opacity
const beat = (name: (typeof WANTLIST_BEATS)[number]['name']) =>
  WANTLIST_BEATS.find((b) => b.name === name)?.at ?? NaN

// Seen: the set is exposed and the element shows
const isSeen = (name: WantlistTrack, ms: number) =>
  opacity('exposure', ms) === 1 && opacity(name, ms) !== 0

describe('WANTLIST_SCORE', () => {
  it('loops whole, from its first frame', () => {
    expect(WANTLIST_SCORE.ending).toEqual({ kind: 'loop', from: 0 })
    expect(playheadAt(WANTLIST_SCORE, 0).part).toBe('loop')
  })

  it('plays its beats in order: a want, the exact release added, the offer, removed, off the wantlist', () => {
    expect(WANTLIST_BEATS.map((b) => b.name)).toEqual([
      'want',
      'added',
      'fulfilled',
      'removed',
      'offWantlist',
    ])
    const times = WANTLIST_BEATS.map((b) => b.at)
    expect(times).toEqual([...times].sort((a, b) => a - b))
    expect(times.at(-1)).toBeLessThan(WANTLIST_SCORE.length)
  })

  it('opens on the want, sharp on the wantlist, the Record screen not yet there', () => {
    const ms = beat('want') + 1200
    expect(isSeen('want', ms)).toBe(true)
    expect(look('wantlist', ms).blur).toBe(0)
    expect(opacity('screen', ms)).toBe(0)
  })

  it('turns the Collection toggle to Owned once the exact release is added', () => {
    expect(opacity('owned', beat('added') - 100)).toBe(0)
    expect(opacity('unowned', beat('added') - 100)).toBe(1)
    expect(opacity('owned', beat('added') + 400)).toBe(1)
    expect(opacity('unowned', beat('added') + 400)).toBe(0)
  })

  it('offers to take it off the wantlist only once it is a fulfilled want', () => {
    expect(opacity('prompt', beat('fulfilled') - 1)).toBe(0)
    expect(opacity('prompt', beat('removed'))).toBe(1)
  })

  it('takes the want off the wantlist after Remove, and the count drops', () => {
    expect(isSeen('want', beat('removed'))).toBe(true)
    const after = beat('offWantlist') + 900
    expect(opacity('want', after)).toBe(0)
    expect(look('wantlist', after).blur).toBe(0)
    expect(opacity('count:2', after)).toBe(1)
    expect(opacity('count:3', after)).toBe(0)
    expect(opacity('count:3', beat('want') + 1200)).toBe(1)
  })

  it('wraps seamlessly, or out of sight', () => {
    const { length } = WANTLIST_SCORE
    expect(opacity('exposure', 0)).toBe(0)
    expect(opacity('exposure', length)).toBe(0)
    // The camera comes round exactly; the rest may jump while the set is dark
    expect(look('camera', length)).toEqual(look('camera', 0))
  })

  it('stills on the offer: the record Owned, the prompt up, all sharp', () => {
    const { still } = WANTLIST_SCORE
    expect(still).toBeGreaterThan(beat('fulfilled'))
    expect(still).toBeLessThan(beat('removed'))
    expect(opacity('exposure', still)).toBe(1)
    expect(opacity('screen', still)).toBe(1)
    expect(look('screen', still).blur).toBe(0)
    expect(opacity('owned', still)).toBe(1)
    expect(opacity('prompt', still)).toBe(1)
  })

  it('cuts nowhere: every look moves on its curves', () => {
    expect(WANTLIST_SCORE.cuts).toEqual([])
  })
})
