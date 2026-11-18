import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

import type { Look, Shot } from '../film/film.model'
import { EASE } from './hero-cues.score'
import { HERO_FILM_MS, HERO_SCORES, heroBeatAt } from './hero.score'
import type { HeroTrack } from './hero.score'

const FRAMINGS = ['wide', 'tall'] as const

// The beats a viewer sees, in order, every 50ms through the film
const beatsSeen = (until: number) => {
  const seen: string[] = []
  for (let ms = 0; ms <= until; ms += 50) {
    const beat = heroBeatAt(ms)
    if (seen.at(-1) !== beat) seen.push(beat)
  }
  return seen
}

// Shots sampled once per framing and moment: the tests below look at many
// tracks at the same moments
const shots = new Map<string, Shot<HeroTrack>>()
const shotAt = (framing: (typeof FRAMINGS)[number], ms: number) => {
  const key = `${framing}:${ms}`
  const shot = shots.get(key) ?? HERO_SCORES[framing].sample(ms)
  shots.set(key, shot)
  return shot
}

const opacity =
  (framing: (typeof FRAMINGS)[number], name: HeroTrack) => (ms: number) =>
    shotAt(framing, ms)[name]?.opacity ?? 0

describe('the hero film', () => {
  it('tells its story in order: Challenge, Cover first, Stack, Hero record, Pull back', () => {
    expect(beatsSeen(HERO_FILM_MS - 1)).toEqual([
      'challenge',
      'cover',
      'stack',
      'hero',
      'pull',
    ])
  })

  it('lasts 16s, a Challenge of 2s and a Cover first of 3s', () => {
    expect(HERO_FILM_MS).toBe(16_000)
    expect(heroBeatAt(1999)).toBe('challenge')
    expect(heroBeatAt(2000)).toBe('cover')
    expect(heroBeatAt(4999)).toBe('cover')
    expect(heroBeatAt(5000)).toBe('stack')
  })

  it('eases with the design tokens, as src/styles.css defines them', () => {
    const css = readFileSync(
      new URL('../../../styles.css', import.meta.url),
      'utf8',
    )
    const token = (name: string) =>
      css
        .match(new RegExp(`--ease-${name}:\\s*cubic-bezier\\(([^)]+)\\)`))?.[1]
        .split(',')
        .map(Number)
    expect(EASE.platter).toEqual(token('platter'))
    expect(EASE.fade).toEqual(token('fade'))
  })

  describe.each(FRAMINGS)('composed %s', (framing) => {
    const score = HERO_SCORES[framing]

    it('fades up from the page ground, cold and grey until the Covers', () => {
      expect(opacity(framing, 'exposure')(0)).toBe(1)
      expect(opacity(framing, 'exposure')(700)).toBe(0)
      expect(opacity(framing, 'grade')(1900)).toBe(1)
      expect(opacity(framing, 'grade')(5000)).toBe(0)
    })

    it('flips the rows into Covers: the wall is all Covers once the wave has passed', () => {
      const flip = (ms: number) =>
        score
          .sample(ms)
          .w0?.transform?.flatMap((move) =>
            'rotateX' in move ? [move.rotateX] : [],
          )[0]
      expect(flip(1900)).toBeCloseTo(0)
      expect(flip(4500)).toBeCloseTo(-180)
    })

    it('moves only transforms and opacity, which the compositor plays: never a blur', () => {
      for (let ms = 0; ms <= score.length; ms += 250) {
        const shot = score.sample(ms)
        for (const name of score.tracks) {
          const look: Look = shot[name] ?? {}
          expect(look.blur).toBeUndefined()
          expect(look.draw).toBeUndefined()
        }
      }
    })

    it('racks focus with the lens: the wall goes soft behind the hero record', () => {
      const [soft, sharp] = [
        opacity(framing, 'w4-soft'),
        opacity(framing, 'w4-face'),
      ]
      expect(soft(1000)).toBe(0)
      expect(soft(13_000)).toBeGreaterThan(sharp(13_000))
      // The hero record's Cover stays readable as its disc comes out
      expect(opacity(framing, 's2-soft')(12_900)).toBeLessThan(0.3)
    })
  })
})
