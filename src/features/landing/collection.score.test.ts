import { describe, expect, it } from 'vitest'

import { playheadAt } from './film/film.model'
import type { Look, Move } from './film/film.model'
import {
  COLLECTION_BEATS,
  COLLECTION_LOOP_MS,
  COLLECTION_SCORE,
  COLLECTION_TRACKS,
} from './collection.score'
import type { CollectionTrack, COLLECTION_SLOTS } from './collection.score'

const look = (name: CollectionTrack, ms: number): Look =>
  COLLECTION_SCORE.sample(ms)[name] ?? {}
const opacity = (name: CollectionTrack, ms: number) =>
  look(name, ms).opacity ?? 1
// The track's sideways shift, stage units (the first translate)
const shiftX = (name: CollectionTrack, ms: number) => {
  const move = look(name, ms).transform?.find(
    (m): m is Extract<Move, { translate: unknown }> => 'translate' in m,
  )
  return move?.translate[0] ?? 0
}
const turn = (
  name: CollectionTrack,
  ms: number,
  axis: 'rotateX' | 'rotateY',
) => {
  for (const move of look(name, ms).transform ?? []) {
    if (axis === 'rotateX' && 'rotateX' in move) return move.rotateX
    if (axis === 'rotateY' && 'rotateY' in move) return move.rotateY
  }
  return 0
}
const scaleOf = (name: CollectionTrack, ms: number) => {
  for (const move of look(name, ms).transform ?? [])
    if ('scale' in move) return move.scale
  return 1
}
const cameraScale = (ms: number) => scaleOf('camera', ms)
type Slot = (typeof COLLECTION_SLOTS)[number]

// The Sleeve pull's pose on the centred slide: sleeve left, disc right, by a
// fifth of the sleeve each
const isPulled = (slot: 0 | 1, ms: number) =>
  shiftX(`sleeve:${slot}`, ms) < -5 && shiftX(`disc:${slot}`, ms) > 5
const isTucked = (slot: 0 | 1, ms: number) =>
  shiftX(`sleeve:${slot}`, ms) === 0 && shiftX(`disc:${slot}`, ms) === 0
const isCentred = (slot: Slot, ms: number) =>
  shiftX(`slide:${slot}`, ms) === 0 && opacity(`slide:${slot}`, ms) === 1
const screenOpen = (ms: number) => opacity('screen', ms) === 1

describe('COLLECTION_SCORE', () => {
  it('loops the whole film, from 0', () => {
    expect(COLLECTION_SCORE.ending).toEqual({ kind: 'loop', from: 0 })
    expect(COLLECTION_SCORE.length).toBe(COLLECTION_LOOP_MS)
    expect(playheadAt(COLLECTION_SCORE, 12_345)).toEqual({
      part: 'loop',
      ms: 2345,
    })
  })

  it('opens on the Sleeve pull: the centred disc out, caption shown, screen shut', () => {
    expect(isCentred(0, 0)).toBe(true)
    expect(isPulled(0, 0)).toBe(true)
    expect(opacity('caption:0', 0)).toBe(1)
    expect(opacity('screen', 0)).toBe(0)
    expect(opacity('flyer', 0)).toBe(0)
  })

  it('plays its beats in order: pull, advance, pull the next, Cover grows, back', () => {
    // Beat times, found by walking the film, must come in order
    const first = (test: (ms: number) => boolean, from = 0) => {
      for (let ms = from; ms <= COLLECTION_LOOP_MS; ms += 10)
        if (test(ms)) return ms
      return Infinity
    }
    const tucked = first((ms) => isTucked(0, ms))
    const advanced = first((ms) => isCentred(1, ms), tucked)
    const nextPulled = first((ms) => isPulled(1, ms), advanced)
    const opened = first(screenOpen, nextPulled)
    const shut = first((ms) => opacity('screen', ms) === 0, opened)

    expect(tucked).toBeGreaterThan(0)
    expect(advanced).toBeGreaterThan(tucked)
    expect(nextPulled).toBeGreaterThan(advanced)
    expect(opened).toBeGreaterThan(nextPulled)
    expect(shut).toBeGreaterThan(opened)
    expect(shut).toBeLessThan(COLLECTION_LOOP_MS)
  })

  it('grows the Cover from the pulled sleeve into the Record screen, then back', () => {
    const flying = [...Array(COLLECTION_LOOP_MS / 10).keys()]
      .map((i) => i * 10)
      .filter((ms) => opacity('flyer', ms) === 1)
    const [out, back] = [flying[0], flying[flying.length - 1]]
    // Leaves and lands over the centred sleeve, pulled
    // (the camera scales the strip about the centred slide)
    expect(shiftX('flyer', out)).toBeCloseTo(
      shiftX('sleeve:1', out) * cameraScale(out),
    )
    expect(shiftX('flyer', back)).toBeCloseTo(
      shiftX('sleeve:0', back) * cameraScale(back),
    )
    // Smaller in the strip than on the Record screen: it grows
    expect(scaleOf('flyer', out)).toBeLessThan(1)
    expect(isPulled(1, out)).toBe(true)
    expect(isPulled(0, back) || shiftX('sleeve:0', back) < -5).toBe(true)
    // In between, it rests as the Record screen's Cover
    expect(look('flyer', (out + back) / 2).transform).toContainEqual({
      scale: 1,
    })
  })

  it('meets the sleeve square to the lens, so the Cover hands off cleanly', () => {
    const handoffs = [...Array(COLLECTION_LOOP_MS).keys()].filter(
      (ms) => opacity('flyer', ms) !== opacity('flyer', ms + 1),
    )
    expect(handoffs.length).toBeGreaterThan(0)
    for (const ms of handoffs) {
      expect(turn('camera', ms, 'rotateX')).toBe(0)
      expect(turn('camera', ms, 'rotateY')).toBe(0)
    }
  })

  it('moves the camera around the strip in 3D', () => {
    expect(Math.abs(turn('camera', 0, 'rotateY'))).toBeGreaterThan(4)
    expect(look('camera', 0).transform?.[0]).toHaveProperty('perspective')
  })

  it('wraps seamlessly: the last frame is the first', () => {
    const normalise = (name: CollectionTrack, value: Look) =>
      name === 'spin'
        ? {
            transform: value.transform?.map((m) =>
              'rotateZ' in m ? { rotateZ: m.rotateZ % 360 } : m,
            ),
          }
        : value
    for (const name of COLLECTION_TRACKS)
      expect([name, normalise(name, look(name, COLLECTION_LOOP_MS))]).toEqual([
        name,
        normalise(name, look(name, 0)),
      ])
  })

  it('cuts only while the Record screen hides the strip', () => {
    expect(COLLECTION_SCORE.cuts.length).toBeGreaterThan(0)
    for (const cut of COLLECTION_SCORE.cuts) {
      const flyerCut =
        opacity('flyer', cut) !== opacity('flyer', cut + 1) ||
        opacity('flyer', cut - 1) !== opacity('flyer', cut)
      // The flying Cover swaps with its sleeve where they line up; anything
      // else jumps only behind the screen
      if (!flyerCut) expect([cut, screenOpen(cut)]).toEqual([cut, true])
    }
  })

  it('moves only transforms and opacity: never an animated blur', () => {
    for (let ms = 0; ms <= COLLECTION_SCORE.length; ms += 50)
      for (const part of Object.values(COLLECTION_SCORE.sample(ms)))
        expect(part).not.toHaveProperty('blur')
  })

  it('sets the neighbours out of focus with a soft twin, the centre sharp', () => {
    expect(opacity('slide:0:soft', 0)).toBe(0)
    expect(opacity('slide:-1:soft', 0)).toBe(1)
    expect(opacity('slide:1:soft', 0)).toBe(1)
    // Half way along the advance, the coming slide is half in focus
    expect(opacity('slide:1:soft', 2950)).toBeGreaterThan(0)
    expect(opacity('slide:1:soft', 2950)).toBeLessThan(1)
    expect(opacity('slide:1:soft', 3600)).toBe(0)
    // The sharp face gives way, so no crisp edge shows round a soft one
    expect(opacity('slide:-1:sharp', 0)).toBe(0)
    expect(opacity('slide:0:sharp', 0)).toBe(1)
  })

  it('holds the Sleeve pull as its still: disc out, caption shown', () => {
    const { still } = COLLECTION_SCORE
    expect(isCentred(0, still)).toBe(true)
    expect(isPulled(0, still)).toBe(true)
    expect(opacity('caption:0', still)).toBe(1)
    expect(opacity('screen', still)).toBe(0)
  })
})

describe('COLLECTION_BEATS', () => {
  const each = (step: number) =>
    [...Array((3 * COLLECTION_LOOP_MS) / step).keys()].map((i) => i * step)

  it('advances the strip one record a pass', () => {
    expect(COLLECTION_BEATS.at(0).pass).toBe(0)
    expect(COLLECTION_BEATS.at(COLLECTION_LOOP_MS + 1000).pass).toBe(1)
    expect(COLLECTION_BEATS.at(2 * COLLECTION_LOOP_MS + 1000).pass).toBe(2)
  })

  it('opens the Record screen on the record pulled out just before', () => {
    // The record that came to the centre (slot 1 of the pass) is on screen
    const opened = each(10).find(screenOpenAt)
    expect(opened).toBeDefined()
    const scene = COLLECTION_BEATS.at(opened ?? 0)
    expect(scene.screen).toBe(scene.pass + 1)
  })

  it('changes records only out of sight', () => {
    let last = COLLECTION_BEATS.at(0)
    for (const elapsed of each(10)) {
      const scene = COLLECTION_BEATS.at(elapsed)
      const ms = elapsed % COLLECTION_LOOP_MS
      if (scene.pass !== last.pass)
        expect([elapsed, screenOpen(ms)]).toEqual([elapsed, true])
      if (scene.screen !== last.screen)
        expect([elapsed, opacity('screen', ms), opacity('flyer', ms)]).toEqual([
          elapsed,
          0,
          0,
        ])
      last = scene
    }
  })

  it('waits exactly until the next change of scene', () => {
    for (const elapsed of [0, 3000, 7000, 9999, 15_000, 27_500]) {
      const next = COLLECTION_BEATS.next(elapsed)
      expect(next).toBeGreaterThan(0)
      expect(COLLECTION_BEATS.at(elapsed + next)).not.toEqual(
        COLLECTION_BEATS.at(elapsed),
      )
      expect(COLLECTION_BEATS.at(elapsed + next - 1)).toEqual(
        COLLECTION_BEATS.at(elapsed),
      )
    }
  })
})

const screenOpenAt = (elapsed: number) =>
  screenOpen(elapsed % COLLECTION_LOOP_MS)
