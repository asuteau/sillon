import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

import {
  HERO_SLOTS,
  HERO_STILL,
  HERO_TRACKS,
  heroCast,
  LOOP_ENTRY_MS,
  LOOP_MS,
  OPENING_MS,
  frameAt,
  heroClockAt,
  heroSceneAt,
  keyframesOf,
  msUntilNextCue,
  poseTransform,
} from './landing.timeline'
import type { Frame, HeroTrackName } from './landing.timeline'

const names = Object.keys(HERO_TRACKS.opening) as HeroTrackName[]
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
  it('plays the opening once, then the loop', () => {
    expect(heroSceneAt(0)).toEqual({ part: 'opening', pass: 0, screen: 1 })
    expect(heroSceneAt(6599).part).toBe('opening')
    expect(heroSceneAt(6600).part).toBe('loop')
    expect(heroSceneAt(60_000).part).toBe('loop')
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

describe('heroClockAt', () => {
  it('runs the opening from 0, then the loop from where it joins', () => {
    expect(heroClockAt(1234)).toEqual({ part: 'opening', ms: 1234 })
    expect(heroClockAt(6600)).toEqual({ part: 'loop', ms: 1800 })
    expect(heroClockAt(6600 + 5800)).toEqual({ part: 'loop', ms: 0 })
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

describe('HERO_STILL', () => {
  it("is the opening's last frame, where the loop joins on the strip", () => {
    expect(HERO_STILL).toEqual({ part: 'opening', ms: OPENING_MS })
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
    const { ms } = HERO_STILL
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
    expect(opening('wordmark', 1350).opacity).toBeLessThan(1)
    expect(opening('wordmark', 1450).opacity).toBe(1)
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

describe('keyframesOf', () => {
  const frame = (at: number, over: Partial<Frame> = {}): Frame => ({
    at,
    opacity: 1,
    pose: { x: 0, y: 0, s: 1, r: 0, ry: 0 },
    draw: 1,
    ...over,
  })

  it('spreads the frames over the part, easing each step', () => {
    const keyframes = keyframesOf(
      [frame(0, { opacity: 0, ease: 'fade' }), frame(500), frame(1000)],
      1000,
    )
    expect(keyframes.map((k) => [k.offset, k.opacity, k.easing])).toEqual([
      [0, 0, 'cubic-bezier(0.2, 0, 0, 1)'],
      [0.5, 1, 'linear'],
      [1, 1, 'linear'],
    ])
  })

  it('animates only what changes', () => {
    const [still] = keyframesOf([frame(0, { opacity: 0 }), frame(10)], 10)
    expect(still).not.toHaveProperty('transform')
    expect(still).not.toHaveProperty('strokeDashoffset')
  })

  it('eases with the design tokens, as src/styles.css defines them', () => {
    const css = readFileSync(
      new URL('../../styles.css', import.meta.url),
      'utf8',
    )
    const token = (name: string) =>
      css
        .match(new RegExp(`--ease-${name}:\\s*([^;]+);`))?.[1]
        .replace(/,\s*/g, ', ')
    const easing = (ease: Frame['ease']) =>
      keyframesOf([frame(0, { opacity: 0, ease }), frame(1)], 1)[0].easing

    expect(easing('platter')).toBe(token('platter'))
    expect(easing('fade')).toBe(token('fade'))
  })

  it('holds the first and last frames to the part edges', () => {
    const keyframes = keyframesOf(
      [frame(200, { opacity: 0 }), frame(400)],
      1000,
    )
    expect(keyframes.map((k) => [k.offset, k.opacity])).toEqual([
      [0, 0],
      [0.2, 0],
      [0.4, 1],
      [1, 1],
    ])
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

describe('poseTransform', () => {
  it('moves in container units, turns and scales', () => {
    expect(poseTransform({ x: -10, y: 2, s: 0.82, r: -8, ry: 55 })).toBe(
      'perspective(1000px) translate(-10cqw, 2cqw) rotateY(55deg) rotate(-8deg) scale(0.82)',
    )
  })
})
