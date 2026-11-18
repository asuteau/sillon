import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

import { lookStyle } from '../film/film-css.utils'
import { playheadAt } from '../film/film.model'
import type { Look, Move, Shot } from '../film/film.model'
import { JACKET } from '../film/jacket.utils'
import { EASE, LAYOUT } from './hero-cues.score'
import {
  HERO_FILM_MS,
  HERO_HOLD_FROM_MS,
  HERO_SCORES,
  HERO_STAGES,
  heroBeatAt,
} from './hero.score'
import type { HeroTrack } from './hero.score'

const FRAMINGS = ['wide', 'tall'] as const
const STACK = [0, 1, 2] as const

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

// The first moment, every 20ms, something is so
const firstWhen = (test: (ms: number) => boolean, from = 0) => {
  for (let ms = from; ms <= HERO_FILM_MS; ms += 20) if (test(ms)) return ms
  return Infinity
}

// How far the disc is out of its sleeve, stage units
const discOut = (framing: (typeof FRAMINGS)[number], ms: number) => {
  const move = HERO_SCORES[framing].sample(ms).disc?.transform?.at(0)
  return move && 'translate' in move ? move.translate[0] : 0
}

// CSS's own geometry, independent of the score's: x right, y down, z toward
// the viewer; a transform list applies its last move first
type Vec = readonly [number, number, number]
const rad = (deg: number) => (deg * Math.PI) / 180
const subV = (a: Vec, b: Vec): Vec => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
const dotV = (a: Vec, b: Vec) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
const norm = (v: Vec): Vec => {
  const l = Math.hypot(...v)
  return [v[0] / l, v[1] / l, v[2] / l]
}
const applyMove = (move: Move, [x, y, z]: Vec, isPoint: boolean): Vec => {
  if ('translate' in move) {
    if (!isPoint) return [x, y, z]
    const [tx, ty, tz = 0] = move.translate
    return [x + tx, y + ty, z + tz]
  }
  if ('rotateX' in move) {
    const [c, s] = [Math.cos(rad(move.rotateX)), Math.sin(rad(move.rotateX))]
    return [x, y * c - z * s, y * s + z * c]
  }
  if ('rotateY' in move) {
    const [c, s] = [Math.cos(rad(move.rotateY)), Math.sin(rad(move.rotateY))]
    return [x * c + z * s, y, -x * s + z * c]
  }
  if ('rotateZ' in move) {
    const [c, s] = [Math.cos(rad(move.rotateZ)), Math.sin(rad(move.rotateZ))]
    return [x * c - y * s, x * s + y * c, z]
  }
  throw new Error(`Not a rigid move: ${JSON.stringify(move)}`)
}
const applyMoves = (moves: readonly Move[], v: Vec, isPoint: boolean) =>
  moves.reduceRight((acc, move) => applyMove(move, acc, isPoint), v)

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

    it('counts the Stack to 3 before the one confirm, then adds it', () => {
      const three = firstWhen((ms) => opacity(framing, 'hud-n3')(ms) > 0.99)
      const confirm = firstWhen((ms) => opacity(framing, 'hud-press')(ms) > 0.5)
      const added = firstWhen((ms) => opacity(framing, 'added')(ms) > 0.5)
      const one = firstWhen((ms) => opacity(framing, 'hud-n1')(ms) > 0.99)
      expect(heroBeatAt(one)).toBe('stack')
      expect(three).toBeLessThan(confirm)
      expect(confirm).toBeLessThan(added)
      expect(added).toBeLessThan(11_000)
    })

    it('lands the Stack in the collection after the confirm, each sleeve lit as it lands', () => {
      const confirm = firstWhen((ms) => opacity(framing, 'hud-press')(ms) > 0.5)
      for (const k of STACK) {
        // On the floor until then, airborne after
        expect(opacity(framing, `s${k}-shadow`)(confirm)).toBe(1)
        expect(opacity(framing, `s${k}-shadow`)(10_500)).toBe(0)
        const landed = firstWhen(
          (ms) => opacity(framing, `s${k}-landed`)(ms) > 0.5,
        )
        expect(landed).toBeGreaterThan(confirm)
        expect(landed).toBeLessThan(10_600)
      }
    })

    it('slides the hero record’s disc out, and keeps it out', () => {
      expect(discOut(framing, 11_000)).toBe(0)
      const out = discOut(framing, 13_500)
      expect(out).toBeGreaterThan(0)
      expect(discOut(framing, HERO_FILM_MS)).toBe(out)
    })

    it('ends in its ambient hold, never back at the Challenge', () => {
      const later = playheadAt(score, 10 * 60_000)
      expect(later.part).toBe('loop')
      expect(later.ms).toBeGreaterThanOrEqual(HERO_HOLD_FROM_MS)
      expect(heroBeatAt(later.ms)).toBe('hold')
      expect(score.sample(later.ms).exposure?.opacity).toBe(0)
      expect(score.sample(later.ms).grade?.opacity).toBe(0)
      expect(discOut(framing, later.ms)).toBe(discOut(framing, HERO_FILM_MS))
    })

    it('loops the hold seamlessly: its end is its start, the disc a whole turn on', () => {
      const css = (ms: number) => {
        const shot = score.sample(ms)
        return score.tracks.map((name) => {
          const look: Look = shot[name] ?? {}
          if (name !== 'spin') return [name, lookStyle(look)]
          const turn = look.transform?.at(0)
          return [name, turn && 'rotateZ' in turn ? turn.rotateZ % 360 : 0]
        })
      }
      const from = css(HERO_HOLD_FROM_MS)
      const end = css(score.length)
      from.forEach(([name, look], i) => {
        if (name === 'spin') expect(end[i][1]).toBeCloseTo(Number(look), 3)
        else expect(end[i]).toEqual([name, look])
      })
    })

    it('moves only transforms and opacity, which the compositor plays: never a blur', () => {
      for (let ms = 0; ms <= score.length; ms += 250) {
        const shot = score.sample(ms)
        for (const name of score.tracks) {
          const look: Look = shot[name] ?? {}
          expect(look).not.toHaveProperty('blur')
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
      expect(opacity(framing, 's2-soft-front')(12_900)).toBeLessThan(0.3)
    })

    // Firefox ignores `backface-visibility` on a face without a transform
    // of its own (the rows), and any browser does once an ancestor flattens
    // the 3D: each face is shown by the score, only while it faces the lens
    it('shows each flipping face only while it faces the lens', () => {
      const { perspective, unit } = HERO_STAGES[framing]
      const d = JACKET.depth * unit
      const eye: Vec = [0, 0, perspective]
      // [track, its face, the face's normal and centre in the track's frame]
      type Face = readonly [HeroTrack, HeroTrack, Vec, Vec]
      const faces = (n: number): Face[] => [
        ...Array.from({ length: n }, (_, i): Face[] => [
          [`w${i}`, `w${i}-row`, [0, 0, 1], [0, 0, 0]],
          [`w${i}`, `w${i}-face`, [0, 0, -1], [0, 0, -d / 2]],
          [`w${i}`, `w${i}-soft`, [0, 0, -1], [0, 0, -d / 2]],
        ]).flat(),
        ...STACK.flatMap((k): Face[] => [
          [`s${k}`, `s${k}-front`, [0, 0, 1], [0, 0, d / 2]],
          [`s${k}`, `s${k}-soft-front`, [0, 0, 1], [0, 0, d / 2]],
          [`s${k}`, `s${k}-back`, [0, 0, -1], [0, 0, -d / 2]],
          [`s${k}`, `s${k}-soft-back`, [0, 0, -1], [0, 0, -d / 2]],
        ]),
      ]
      let [checked, hidden] = [0, 0]
      for (let ms = 0; ms <= score.length; ms += 100) {
        const shot = shotAt(framing, ms)
        const world = shot.world?.transform ?? []
        for (const [parent, face, normal, centre] of faces(
          LAYOUT[framing].count,
        )) {
          const moves = [...world, ...(shot[parent]?.transform ?? [])]
          const n = norm(applyMoves(moves, normal, false))
          const p = applyMoves(moves, centre, true)
          const facing = dotV(n, norm(subV(eye, p)))
          // Edge on, either is right
          if (Math.abs(facing) < 0.05) continue
          checked++
          const shown = shot[face]?.opacity
          if (facing < 0) {
            hidden++
            expect({ ms, face, shown }).toEqual({ ms, face, shown: 0 })
          } else if (face.endsWith('-row')) {
            // The Challenge: a row is there until it turns
            expect({ ms, face, shown }).toEqual({ ms, face, shown: 1 })
          }
        }
      }
      // Both sides were seen turned away
      expect(hidden).toBeGreaterThan(checked / 4)
    })

    it('holds the hero record with its disc out as the reduced-motion still', () => {
      expect(['hero', 'pull']).toContain(heroBeatAt(score.still))
      expect(discOut(framing, score.still)).toBe(discOut(framing, HERO_FILM_MS))
    })
  })
})
