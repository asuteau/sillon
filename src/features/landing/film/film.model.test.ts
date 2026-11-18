import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

import { CURVES, bezier, partSpan, playheadAt, track } from './film.model'
import type { Score } from './film.model'

const score = (ending: Score<'a'>['ending']): Score<'a'> => ({
  tracks: ['a'],
  length: 10_000,
  ending,
  still: 9000,
  cuts: [],
  sample: (ms) => ({ a: { opacity: ms / 10_000 } }),
})

describe('bezier', () => {
  it('holds its ends and passes through the curve', () => {
    const ease = bezier(CURVES.linear)
    expect(ease(0)).toBe(0)
    expect(ease(0.25)).toBeCloseTo(0.25)
    expect(ease(1)).toBe(1)
  })

  it('eases out fast and lands soft, as CSS draws it', () => {
    // cubic-bezier(.16,1,.3,1) at half time: well past the middle
    expect(bezier(CURVES.out)(0.5)).toBeGreaterThan(0.9)
    expect(bezier(CURVES.platter)(0.5)).toBeCloseTo(0.5, 0)
  })
})

describe('CURVES', () => {
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

    expect(CURVES.platter).toEqual(token('platter'))
    expect(CURVES.fade).toEqual(token('fade'))
  })
})

describe('track', () => {
  it('holds before the first key and after the last', () => {
    const t = track([
      [1000, 2],
      [2000, 4],
    ])
    expect(t(0)).toBe(2)
    expect(t(5000)).toBe(4)
  })

  it('eases each step with the curve on the key it leaves', () => {
    const t = track([
      [0, 0, CURVES.out],
      [1000, 10],
      [2000, 20],
    ])
    expect(t(500)).toBeGreaterThan(9)
    expect(t(1500)).toBeCloseTo(15)
  })
})

describe('playheadAt', () => {
  it('plays once to a hold', () => {
    const film = score({ kind: 'hold' })
    expect(playheadAt(film, 4000)).toEqual({ part: 'intro', ms: 4000 })
    expect(playheadAt(film, 10_000)).toEqual({ part: 'held', ms: 10_000 })
    expect(playheadAt(film, 99_000)).toEqual({ part: 'held', ms: 10_000 })
  })

  it('plays the intro once, then loops back to where the loop starts', () => {
    const film = score({ kind: 'loop', from: 6000 })
    expect(playheadAt(film, 5999)).toEqual({ part: 'intro', ms: 5999 })
    expect(playheadAt(film, 6000)).toEqual({ part: 'loop', ms: 6000 })
    expect(playheadAt(film, 9999)).toEqual({ part: 'loop', ms: 9999 })
    expect(playheadAt(film, 10_000)).toEqual({ part: 'loop', ms: 6000 })
    expect(playheadAt(film, 10_000 + 4000 * 3 + 500)).toEqual({
      part: 'loop',
      ms: 6500,
    })
  })

  it('loops the whole film when the loop starts at 0', () => {
    const film = score({ kind: 'loop', from: 0 })
    expect(playheadAt(film, 0)).toEqual({ part: 'loop', ms: 0 })
    expect(playheadAt(film, 12_000)).toEqual({ part: 'loop', ms: 2000 })
  })
})

describe('partSpan', () => {
  it('splits the film where the loop starts', () => {
    const film = score({ kind: 'loop', from: 6000 })
    expect(partSpan(film, 'intro')).toEqual([0, 6000])
    expect(partSpan(film, 'loop')).toEqual([6000, 10_000])
  })

  it('holds on the last frame', () => {
    const film = score({ kind: 'hold' })
    expect(partSpan(film, 'intro')).toEqual([0, 10_000])
    expect(partSpan(film, 'held')).toEqual([10_000, 10_000])
  })
})
