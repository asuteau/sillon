import { describe, expect, it } from 'vitest'

import {
  bakeInSteps,
  bakePart,
  lookStyle,
  transformCss,
  waapiKeyframes,
  withoutHolds,
} from './film-css.utils'
import type { Score } from './film.model'

describe('transformCss', () => {
  it('writes the moves in order, lengths in container units', () => {
    expect(
      transformCss([
        { perspective: 1000 },
        { translate: [-10, 2] },
        { rotateY: 55 },
        { rotateZ: -8 },
        { scale: 0.82 },
      ]),
    ).toBe(
      'perspective(1000px) translate(-10cqw, 2cqw) rotateY(55deg) rotate(-8deg) scale(0.82)',
    )
  })

  it('moves in depth with a z', () => {
    expect(transformCss([{ translate: [1, 2, -3] }, { rotateX: 4 }])).toBe(
      'translate3d(1cqw, 2cqw, -3cqw) rotateX(4deg)',
    )
  })

  it('stretches along one axis, for a bar drawing in', () => {
    expect(transformCss([{ scaleX: 0.5 }, { scaleY: 0 }])).toBe(
      'scaleX(0.5) scaleY(0)',
    )
  })
})

describe('lookStyle', () => {
  it('sets only what the look has', () => {
    expect(lookStyle({ opacity: 0.5 })).toEqual({ opacity: 0.5 })
    expect(lookStyle({ draw: 0.25 })).toEqual({ '--film-undrawn': 0.75 })
  })
})

// A 1s film: `a` fades in and jumps back out at 600ms; `b` only moves
const film: Score<'a' | 'b'> = {
  tracks: ['a', 'b'],
  length: 1000,
  ending: { kind: 'loop', from: 400 },
  still: 1000,
  cuts: [600, 601],
  sample: (ms) => ({
    a: { opacity: ms <= 600 ? ms / 600 : 0 },
    b: { transform: [{ translate: [ms / 100, 0] }] },
  }),
}

describe('bakePart', () => {
  it('samples the part 30 times a second, and every cut exactly', () => {
    const { duration, times, tracks } = bakePart(film, 'intro')
    expect(duration).toBe(400)
    expect(times[0]).toBe(0)
    expect(times.at(-1)).toBe(1)
    // 400ms at 30 a second
    expect(times).toHaveLength(13)
    expect(tracks.a?.opacity?.at(-1)).toBeCloseTo(400 / 600, 3)

    const loop = bakePart(film, 'loop')
    const at = (ms: number) => loop.times.indexOf((ms - 400) / 600)
    expect(at(600)).toBeGreaterThan(-1)
    expect(loop.tracks.a?.opacity?.[at(600)]).toBe(1)
    expect(loop.tracks.a?.opacity?.[at(601)]).toBe(0)
  })

  it('keyframes each element with what its look sets', () => {
    const { tracks, times } = bakePart(film, 'loop')
    expect(tracks.a).not.toHaveProperty('transform')
    expect(tracks.b).not.toHaveProperty('opacity')
    expect(tracks.b?.transform?.[0]).toBe('translate(4cqw, 0cqw)')
    expect(tracks.b?.transform).toHaveLength(times.length)
  })
})

describe('withoutHolds', () => {
  it('keeps only the keyframes where something changes, and the ends of each hold', () => {
    const times = [0, 0.25, 0.5, 0.75, 1]
    expect(
      withoutHolds(times, {
        opacity: [0, 0, 0, 0.5, 1],
        transform: ['a', 'a', 'a', 'a', 'a'],
      }),
    ).toEqual({
      times: [0, 0.5, 1],
      keyframes: { opacity: [0, 0, 1], transform: ['a', 'a', 'a'] },
    })
  })

  it('keeps both ends of a hold between two moves', () => {
    expect(
      withoutHolds([0, 0.25, 0.5, 0.75, 1], { opacity: [0, 1, 1, 1, 0] }),
    ).toEqual({
      times: [0, 0.25, 0.75, 1],
      keyframes: { opacity: [0, 1, 1, 0] },
    })
  })

  it('keeps only the ends of a straight run: the browser draws the line between', () => {
    expect(
      withoutHolds([0, 0.25, 0.5, 0.75, 1], {
        opacity: [0, 0.25, 0.5, 0.75, 1],
        transform: [
          'translate(0cqw, 1cqw)',
          'translate(1cqw, 1cqw)',
          'translate(2cqw, 1cqw)',
          'translate(3cqw, 1cqw)',
          'translate(4cqw, 1cqw)',
        ],
      }),
    ).toEqual({
      times: [0, 1],
      keyframes: {
        opacity: [0, 1],
        transform: ['translate(0cqw, 1cqw)', 'translate(4cqw, 1cqw)'],
      },
    })
  })

  it('keeps a bend: where the line from the last kept key would miss', () => {
    const { times } =
      withoutHolds([0, 0.25, 0.5, 0.75, 1], {
        transform: [
          'rotate(0deg)',
          'rotate(10deg)',
          'rotate(20deg)',
          'rotate(20deg)',
          'rotate(20deg)',
        ],
      }) ?? {}
    expect(times).toEqual([0, 0.5, 1])
  })

  it('drops a track that never changes: it rests where React put it', () => {
    expect(
      withoutHolds([0, 0.5, 1], {
        opacity: [1, 1, 1],
        transform: ['x', 'x', 'x'],
      }),
    ).toBeNull()
  })
})

describe('waapiKeyframes', () => {
  it('writes each sample as a Web Animations keyframe at its offset', () => {
    expect(
      waapiKeyframes([0, 0.4, 1], {
        opacity: [0, 1, 1],
        transform: ['scale(1)', 'scale(2)', 'scale(1)'],
      }),
    ).toEqual([
      { offset: 0, opacity: 0, transform: 'scale(1)' },
      { offset: 0.4, opacity: 1, transform: 'scale(2)' },
      { offset: 1, opacity: 1, transform: 'scale(1)' },
    ])
  })
})

describe('bakeInSteps', () => {
  it('bakes what bakePart bakes, pausing between steps', () => {
    const steps = bakeInSteps(film, 'loop', 4)
    let pauses = 0
    let step = steps.next()
    while (!step.done) {
      pauses++
      step = steps.next()
    }
    expect(pauses).toBeGreaterThan(1)
    expect(step.value).toEqual(bakePart(film, 'loop'))
  })
})
