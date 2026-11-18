import { describe, expect, it } from 'vitest'

import { bakePart, lookStyle, transformCss } from './film-css.utils'
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
    expect(lookStyle({ draw: 0.25, blur: 1.5 })).toEqual({
      '--film-undrawn': 0.75,
      filter: 'blur(1.5cqw)',
    })
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
