import { describe, expect, it } from 'vitest'

import { cell, sampleStory } from './storyboard.pose'
import { BEATS, FILM_MS, LAYOUT, T } from './storyboard.score'

describe('storyboard score', () => {
  it('plays the five beats in order, back to back, over the film', () => {
    expect(BEATS.map((b) => b.id)).toEqual([
      'challenge',
      'cover',
      'stack',
      'hero',
      'pull',
    ])
    BEATS.slice(1).forEach((b, i) => expect(b.from).toBe(BEATS[i].to))
    expect(BEATS.at(-1)?.to).toBe(FILM_MS / 1000)
  })

  it.each(['wide', 'tall'] as const)(
    'counts the Stack to 3 before the one confirm (%s)',
    (framing) => {
      const before = sampleStory(T.press[0] * 1000, framing)
      expect(before.hud.count).toBeCloseTo(3)
      expect(before.hud.button).toBeCloseTo(1)
    },
  )

  it.each(['wide', 'tall'] as const)(
    'lands the Stack in the collection, then the newest Cover leaves it with its disc (%s)',
    (framing) => {
      const layout = LAYOUT[framing]
      const landed = sampleStory(T.pullOut[0] * 1000, framing)
      landed.stack.forEach((sleeve, k) => {
        const slot = cell(layout, landed.stack.length - 1 - k)
        expect(sleeve.x).toBeCloseTo(slot.x)
        expect(sleeve.y).toBeCloseTo(slot.y)
      })
      const hold = sampleStory(FILM_MS, framing)
      expect(hold.disc).toBeGreaterThan(0.5)
      expect(hold.stack[2].z).toBeCloseTo(layout.hero.z)
    },
  )

  it('starts cold, sharp and flat, on rows', () => {
    const first = sampleStory(1000, 'wide')
    expect(first.grade).toBe(1)
    expect(first.aperture).toBe(0)
    expect(first.wall.every((w) => w.cover === 0)).toBe(true)
  })
})
