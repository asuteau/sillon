import { describe, expect, it } from 'vitest'

import { lookStyle } from './film/film-css.utils'
import { PICKS, RANDOM_PICK_SCORE } from './random-pick.score'
import type { RandomPickTrack } from './random-pick.score'

const score = RANDOM_PICK_SCORE
const css = (name: RandomPickTrack, ms: number) =>
  lookStyle(score.sample(ms)[name] ?? {})
// The discs' turn, in degrees
const spin = (ms: number) => {
  const [move] = score.sample(ms).spin?.transform ?? []
  return 'rotateZ' in move ? move.rotateZ : NaN
}

const opacity = (name: RandomPickTrack, ms: number) =>
  score.sample(ms)[name]?.opacity ?? 1
const moves = (name: RandomPickTrack, ms: number) =>
  score.sample(ms)[name]?.transform ?? []
// The first translate's [x, y, z]
const place = (name: RandomPickTrack, ms: number) => {
  const move = moves(name, ms).find((m) => 'translate' in m)
  const [x, y, z = 0] = move && 'translate' in move ? move.translate : [0, 0]
  return { x, y, z }
}
// A sleeve's lean, degrees: negative is flicked forward
const lean = (name: RandomPickTrack, ms: number) => {
  const move = moves(name, ms).find((m) => 'rotateX' in m)
  return move && 'rotateX' in move ? move.rotateX : 0
}
// A pick is drawn: raised out of the crate, its disc out, its heading shown
const isDrawn = (pick: 'a' | 'b', ms: number) =>
  place(`sleeve:${PICKS[pick].slot}`, ms).y < -20 &&
  place(`disc:${pick}`, ms).x > 10 &&
  opacity(`caption:${pick}`, ms) === 1
const isHome = (pick: 'a' | 'b', ms: number) =>
  place(`sleeve:${PICKS[pick].slot}`, ms).y === 0 &&
  place(`disc:${pick}`, ms).x === 0 &&
  opacity(`caption:${pick}`, ms) === 0

describe('RANDOM_PICK_SCORE', () => {
  it('opens on the crate at rest, "Pick for me" shown', () => {
    expect(isHome('a', 0)).toBe(true)
    expect(isHome('b', 0)).toBe(true)
    expect(opacity('pickFor', 0)).toBe(1)
    expect(opacity('pickAgain', 0)).toBe(0)
    expect(opacity('haze', 0)).toBe(0)
  })

  it('digs: the sleeves in front of a pick flick forward before it rises', () => {
    const { lift } = PICKS.a
    expect(lean('sleeve:0', lift)).toBeLessThan(-10)
    expect(place(`sleeve:${PICKS.a.slot}`, lift).y).toBe(0)
  })

  it('draws a, then b on "Pick again", then closes back to the crate', () => {
    const drawnA = PICKS.a.back - 100
    const drawnB = PICKS.b.back - 100
    expect(isDrawn('a', drawnA)).toBe(true)
    expect(isHome('b', drawnA)).toBe(true)
    expect(opacity('pickAgain', drawnA)).toBe(1)
    // a home before b rises, deeper in the crate
    expect(isHome('a', PICKS.b.lift)).toBe(true)
    expect(PICKS.b.slot).toBeGreaterThan(PICKS.a.slot)
    expect(isDrawn('b', drawnB)).toBe(true)
    expect(isHome('a', drawnB)).toBe(true)
    // Closed: every sleeve back upright, "Pick for me" again
    const closed = score.length - 200
    expect(isHome('b', closed)).toBe(true)
    expect(opacity('pickFor', closed)).toBe(1)
  })

  it('never has both picks out at once', () => {
    for (let ms = 0; ms <= score.length; ms += 50) {
      const outA = place(`sleeve:${PICKS.a.slot}`, ms).y < 0
      const outB = place(`sleeve:${PICKS.b.slot}`, ms).y < 0
      expect([ms, outA && outB]).toEqual([ms, false])
    }
  })

  it('holds the first pick drawn as its reduced-motion still', () => {
    expect(isDrawn('a', score.still)).toBe(true)
    expect(opacity('pickAgain', score.still)).toBe(1)
    expect(opacity('gloss:a', score.still)).toBe(0)
  })

  it('loops from its start, the last frame the first', () => {
    expect(score.ending).toEqual({ kind: 'loop', from: 0 })
    for (const name of score.tracks.filter((track) => track !== 'spin'))
      expect([name, css(name, score.length)]).toEqual([name, css(name, 0)])
    // A whole number of turns
    expect(spin(score.length) % 360).toBe(spin(0))
  })
})
