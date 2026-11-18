import { describe, expect, it } from 'vitest'

import { transformCss } from './film/film-css.utils'
import { playheadAt } from './film/film.model'
import {
  HERO_BEATS,
  HERO_SCORE,
  HERO_SLOTS,
  HERO_TRACK_NAMES,
  HERO_TRACKS,
  heroCast,
  LOOP_ENTRY_MS,
  LOOP_MS,
  OPENING_MS,
  frameAt,
  heroSceneAt,
  msUntilNextCue,
  poseMoves,
} from './hero.score'
import type { Frame, HeroTrackName } from './hero.score'

const names = HERO_TRACK_NAMES
// What shows at a moment, whichever frame it comes from
const shown = ({ opacity, pose, draw }: Frame) => ({ opacity, pose, draw })
const opening = (name: HeroTrackName, ms: number) =>
  shown(frameAt(HERO_TRACKS.opening[name], ms))
const loop = (name: HeroTrackName, ms: number) =>
  shown(frameAt(HERO_TRACKS.loop[name], ms))

// Inside the camera's world: hidden whenever the world is
const inWorld = (name: HeroTrackName) => /^(slide|sleeve|disc)/.test(name)
const inScreen = (name: HeroTrackName) => name.startsWith('screen')

describe('heroSceneAt', () => {
  it('opens on the first record, the second coming in', () => {
    expect(heroSceneAt(0)).toEqual({ pass: 0, screen: 1 })
    expect(heroSceneAt(6600)).toEqual({ pass: 0, screen: 1 })
  })

  it('advances the strip by one record each pass', () => {
    // The loop joins on the strip, 1.8s in; a pass is 7.6s
    expect(heroSceneAt(6600).pass).toBe(0)
    expect(heroSceneAt(6600 + 5799).pass).toBe(0)
    expect(heroSceneAt(6600 + 5800).pass).toBe(1)
    expect(heroSceneAt(6600 + 5800 + 7600).pass).toBe(2)
  })

  it('opens the Record screen on the record that came in, then keeps it into the next pass', () => {
    // Pass 0 brings record 1 in; the screen still shows it as pass 1 starts
    expect(heroSceneAt(6600).screen).toBe(1)
    expect(heroSceneAt(6600 + 5800).screen).toBe(1)
    // Once hidden, it changes to the next record to come in
    expect(heroSceneAt(6600 + 5800 + 1700).screen).toBe(2)
  })
})

describe('HERO_SCORE', () => {
  const at = (name: HeroTrackName, ms: number) => HERO_SCORE.sample(ms)[name]
  const look = (name: HeroTrackName, frame: Frame) =>
    name === 'grooveDraw'
      ? { draw: frame.draw }
      : { opacity: frame.opacity, transform: poseMoves(frame.pose) }

  it('plays the opening once, then the loop from where it joins', () => {
    expect(playheadAt(HERO_SCORE, 1234)).toEqual({ part: 'intro', ms: 1234 })
    expect(playheadAt(HERO_SCORE, 6600).part).toBe('loop')
    for (const name of names) {
      expect([name, at(name, 1234)]).toEqual([
        name,
        look(name, frameAt(HERO_TRACKS.opening[name], 1234)),
      ])
      // The loop's own 0 (the Record screen open), 5.8s after it joins
      expect([name, at(name, 6600 + 5800)]).toEqual([
        name,
        look(name, frameAt(HERO_TRACKS.loop[name], 0)),
      ])
    }
  })

  it('comes round to where the loop joins, seamlessly', () => {
    const { ending, length } = HERO_SCORE
    expect(ending).toEqual({ kind: 'loop', from: OPENING_MS })
    expect(length).toBe(OPENING_MS + LOOP_MS)
    for (const name of names)
      expect([name, at(name, length)]).toEqual([name, at(name, OPENING_MS)])
  })

  it('turns the discs once every 1.9s, a whole number of turns a pass', () => {
    const turn = (ms: number) =>
      HERO_SCORE.sample(ms).spin?.transform?.[0] ?? {}
    expect(turn(950)).toEqual({ rotateZ: 180 })
    expect(turn(1900)).toEqual({ rotateZ: 360 })
    expect(LOOP_MS % 1900).toBe(0)
  })

  it('cuts exactly where a look jumps', () => {
    // The sleeve appears off left; the flying Cover hides on its sleeve
    // (loop 1600) and shows again (loop 4500)
    expect(HERO_SCORE.cuts).toEqual(
      expect.arrayContaining([
        2900,
        2901,
        6600 + 2699,
        6600 + 2700,
        14_000,
        14_001,
      ]),
    )
  })

  it('eases each cue on its curve, not in a straight line', () => {
    // The wordmark rises on `out`: nearly in by half its time
    expect(at('wordmark', 1150)?.opacity).toBeGreaterThan(0.9)
  })
})

describe('HERO_BEATS', () => {
  it('changes scene with heroSceneAt, waiting for each change', () => {
    expect(HERO_BEATS.at(20_000)).toEqual(heroSceneAt(20_000))
    expect(HERO_BEATS.next(20_000)).toBe(msUntilNextCue(20_000))
  })
})

describe('msUntilNextCue', () => {
  it('waits for the next change of scene', () => {
    for (const elapsed of [0, 7000, 12_000, 13_000, 30_000]) {
      const next = msUntilNextCue(elapsed)
      expect(next).toBeGreaterThan(0)
      expect(heroSceneAt(elapsed + next)).not.toEqual(heroSceneAt(elapsed))
      expect(heroSceneAt(elapsed + next - 1)).toEqual(heroSceneAt(elapsed))
    }
  })

  it('never returns zero', () => {
    for (let ms = 0; ms < 40_000; ms += 10)
      expect(msUntilNextCue(ms)).toBeGreaterThan(0)
  })
})

describe('the still', () => {
  it("is the opening's last frame, where the loop joins on the strip", () => {
    expect(HERO_SCORE.still).toBe(OPENING_MS)
  })
})

describe('HERO_TRACKS', () => {
  it('animates the same elements in both parts', () => {
    expect(Object.keys(HERO_TRACKS.loop).sort()).toEqual([...names].sort())
  })

  it('ends the opening exactly where the loop joins', () => {
    for (const name of names)
      expect([name, loop(name, LOOP_ENTRY_MS)]).toEqual([
        name,
        opening(name, OPENING_MS),
      ])
  })

  it('wraps the loop seamlessly, or out of sight', () => {
    const isHidden = (name: HeroTrackName, ms: number) =>
      loop(name, ms).opacity === 0 ||
      (inWorld(name) && loop('world', ms).opacity === 0) ||
      (inScreen(name) && loop('screen', ms).opacity === 0)

    for (const name of names) {
      const jumps =
        JSON.stringify(loop(name, LOOP_MS)) !== JSON.stringify(loop(name, 0))
      if (jumps)
        expect([name, isHidden(name, LOOP_MS) && isHidden(name, 0)]).toEqual([
          name,
          true,
        ])
    }
  })

  it('changes the Record screen and flying Cover only while both are hidden', () => {
    expect(loop('screen', 1700).opacity).toBe(0)
    expect(loop('flyer', 1700).opacity).toBe(0)
  })

  it('holds the full Sleeve pull pose in the still: the strip, disc out, neighbours dimmed, caption', () => {
    const ms = HERO_SCORE.still
    expect(opening('world', ms)).toMatchObject({
      opacity: 1,
      pose: { y: -8, s: 0.58 },
    })
    expect(opening('sleeve:0', ms)).toMatchObject({
      opacity: 1,
      pose: { x: -10 },
    })
    expect(opening('disc:0', ms)).toMatchObject({ opacity: 1, pose: { x: 10 } })
    for (const slot of [-2, -1, 1, 2, 3] as const)
      expect(opening(`slide:${slot}`, ms)).toMatchObject({
        opacity: 0.5,
        pose: { x: slot * 58, s: 0.82 },
      })
    expect(opening('caption:0', ms).opacity).toBe(1)
    expect(opening('pick', ms).opacity).toBe(1)
    for (const name of ['groove', 'wordmark', 'screen', 'flyer'] as const)
      expect(opening(name, ms).opacity).toBe(0)
  })

  it('brings the neighbours in together, not staggered', () => {
    const starts = HERO_SLOTS.filter((slot) => slot !== 0).map(
      (slot) => HERO_TRACKS.opening[`slide:${slot}`][1].at,
    )
    expect(new Set(starts).size).toBe(1)
  })

  it('draws the groove before the wordmark shows', () => {
    expect(opening('grooveDraw', 1350).draw).toBe(1)
    // Its cue lands after the draw (its `out` curve is nearly there sooner)
    const shows = HERO_TRACKS.opening.wordmark.find((f) => f.opacity === 1)
    expect(shows?.at).toBe(1450)
    expect(opening('wordmark', 1100).opacity).toBeLessThan(1)
  })

  it('lands the flying Cover on the centred sleeve in the strip', () => {
    // Strip: sleeve 50cqw pulled 10cqw left, world scaled .58 and raised
    // 8cqw; the Cover is 46cqw, centred 28cqw down
    expect(loop('flyer', 1600)).toMatchObject({
      opacity: 1,
      pose: { x: -5.8, y: 20, s: 0.63 },
    })
  })
})

describe('heroCast', () => {
  it('rotates four records across passes', () => {
    expect([0, 1, 2, 3, 4].map((pass) => heroCast(pass, 0))).toEqual([
      0, 1, 2, 3, 0,
    ])
  })

  it('lines the strip up in order, wrapping round', () => {
    expect(HERO_SLOTS.map((slot) => heroCast(0, slot))).toEqual([
      2, 3, 0, 1, 2, 3,
    ])
  })

  it('centres the record that came in, as the Record screen showed it', () => {
    const { pass, screen } = heroSceneAt(6600 + 5800 + 100)
    expect(heroCast(pass, 0)).toBe(heroCast(pass - 1, 1))
    expect(heroCast(screen, 0)).toBe(heroCast(pass, 0))
  })
})

describe('poseMoves', () => {
  it('moves in container units, turns and scales', () => {
    expect(
      transformCss(poseMoves({ x: -10, y: 2, s: 0.82, r: -8, ry: 55 })),
    ).toBe(
      'perspective(1000px) translate(-10cqw, 2cqw) rotateY(55deg) rotate(-8deg) scale(0.82)',
    )
  })
})
