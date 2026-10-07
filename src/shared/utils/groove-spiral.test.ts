import { describe, expect, it } from 'vitest'

import {
  grooveSpiralPath,
  grooveStrokeWidth,
  grooveTurnsForSize,
} from './groove-spiral'

const CENTRE = 50

const parsePoints = (d: string) =>
  d
    .replace(/^M/, '')
    .split(' L')
    .map((pair) => {
      const [x, y] = pair.split(' ').map(Number)
      return { x, y }
    })

const radiusOf = ({ x, y }: { x: number; y: number }) =>
  Math.hypot(x - CENTRE, y - CENTRE)

// Sum of signed angle steps around the centre, in full turns
const turnsOf = (points: { x: number; y: number }[]) => {
  let total = 0
  for (let i = 1; i < points.length; i++) {
    const a0 = Math.atan2(points[i - 1].y - CENTRE, points[i - 1].x - CENTRE)
    const a1 = Math.atan2(points[i].y - CENTRE, points[i].x - CENTRE)
    let step = a1 - a0
    if (step > Math.PI) step -= 2 * Math.PI
    if (step < -Math.PI) step += 2 * Math.PI
    total += step
  }
  return total / (2 * Math.PI)
}

describe('grooveSpiralPath', () => {
  const d = grooveSpiralPath({ turns: 6, innerRadius: 3, outerRadius: 45 })
  const points = parsePoints(d)

  it('starts at the outer edge, at the top of the 100×100 box', () => {
    expect(d.startsWith('M')).toBe(true)
    expect(points[0].x).toBeCloseTo(50, 1)
    expect(points[0].y).toBeCloseTo(5, 1)
  })

  it('ends at the inner radius, near the centre', () => {
    expect(radiusOf(points[points.length - 1])).toBeCloseTo(3, 1)
  })

  it('moves inwards only', () => {
    const radii = points.map(radiusOf)
    for (let i = 1; i < radii.length; i++) {
      expect(radii[i]).toBeLessThanOrEqual(radii[i - 1] + 0.01)
    }
  })

  it.each([2.5, 4, 6, 9])('winds exactly %s turns', (turns) => {
    const path = grooveSpiralPath({ turns, innerRadius: 3, outerRadius: 45 })
    expect(turnsOf(parsePoints(path))).toBeCloseTo(turns, 2)
  })

  it('stays inside the 100×100 box', () => {
    for (const { x, y } of points) {
      expect(x).toBeGreaterThanOrEqual(0)
      expect(x).toBeLessThanOrEqual(100)
      expect(y).toBeGreaterThanOrEqual(0)
      expect(y).toBeLessThanOrEqual(100)
    }
  })
})

describe('grooveTurnsForSize', () => {
  it.each([
    [120, 9],
    [90, 9],
    [89, 6],
    [48, 6],
    [47, 4],
    [30, 4],
    [29, 2.5],
    [16, 2.5],
  ])('a %spx mark has %s turns', (size, turns) => {
    expect(grooveTurnsForSize(size)).toBe(turns)
  })
})

describe('grooveStrokeWidth', () => {
  it('fills about 38% of the gap between grooves', () => {
    // 9 turns → gap 40/9 ≈ 4.44 → 1.69
    expect(grooveStrokeWidth(96)).toBeCloseTo(1.69, 2)
  })

  it('never goes thinner than 1.6 at regular sizes', () => {
    expect(grooveStrokeWidth(200)).toBeGreaterThanOrEqual(1.6)
  })

  it('thickens below 24px so the favicon stays legible', () => {
    expect(grooveStrokeWidth(16)).toBeCloseTo(6.08, 2)
    expect(grooveStrokeWidth(23)).toBeGreaterThanOrEqual(5.5)
  })
})
