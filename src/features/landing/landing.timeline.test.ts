import { describe, expect, it } from 'vitest'

import {
  HERO_STILL,
  heroSceneAt,
  isCoverLoaded,
  msUntilNextCue,
} from './landing.timeline'

const beatAt = (ms: number) => heroSceneAt(ms).beat

// First moment each beat shows, scanning in 10ms steps from `from`
const beatStarts = (from: number, to: number) => {
  const starts: [string, number][] = []
  for (let ms = from; ms < to; ms += 10) {
    const beat = beatAt(ms)
    if (starts.at(-1)?.[0] !== beat) starts.push([beat, ms])
  }
  return starts
}

describe('heroSceneAt', () => {
  it('plays four beats of about 2s, 3s, 4s and 3s', () => {
    expect(beatStarts(0, 12_000)).toEqual([
      ['intro', 0],
      ['collection', 2000],
      ['scan', 5000],
      ['detail', 9000],
    ])
  })

  it('draws the groove first, then shows the wordmark', () => {
    expect(heroSceneAt(0)).toEqual({ beat: 'intro', wordmark: false })
    expect(heroSceneAt(1500)).toEqual({ beat: 'intro', wordmark: true })
  })

  it('loops from the collection, never replaying the intro', () => {
    expect(beatStarts(12_000, 32_000)).toEqual([
      ['collection', 12_000],
      ['scan', 15_000],
      ['detail', 19_000],
      ['collection', 22_000],
      ['scan', 25_000],
      ['detail', 29_000],
    ])
    expect(heroSceneAt(12_000)).toEqual(heroSceneAt(2000))
  })

  it('fills the grid from empty to every cover', () => {
    expect(heroSceneAt(2000)).toEqual({ beat: 'collection', loaded: 0 })
    expect(heroSceneAt(4900)).toEqual({ beat: 'collection', loaded: 9 })
  })

  it('scans, matches, adds, then asks about the fulfilled want', () => {
    const steps: string[] = []
    for (let ms = 5000; ms < 9000; ms += 10) {
      const scene = heroSceneAt(ms)
      if (scene.beat === 'scan' && steps.at(-1) !== scene.step)
        steps.push(scene.step)
    }
    expect(steps).toEqual(['aim', 'match', 'added', 'fulfilled'])
  })

  it('opens the detail after showing the grid', () => {
    expect(heroSceneAt(9000)).toEqual({ beat: 'detail', open: false })
    expect(heroSceneAt(11_900)).toEqual({ beat: 'detail', open: true })
  })
})

describe('msUntilNextCue', () => {
  it('waits for the next change of scene', () => {
    expect(msUntilNextCue(0)).toBeGreaterThan(0)
    const next = msUntilNextCue(0)
    expect(heroSceneAt(next)).not.toEqual(heroSceneAt(0))
    expect(heroSceneAt(next - 1)).toEqual(heroSceneAt(0))
  })

  it('wraps from the last cue to the start of the loop', () => {
    expect(msUntilNextCue(11_900)).toBe(100)
    expect(msUntilNextCue(21_900)).toBe(100)
  })

  it('never returns zero on a cue', () => {
    for (let ms = 0; ms < 22_000; ms += 10)
      expect(msUntilNextCue(ms)).toBeGreaterThan(0)
  })
})

describe('isCoverLoaded', () => {
  it('loads the covers out of grid order, like real images', () => {
    const order = Array.from({ length: 9 }, (_, loaded) =>
      Array.from({ length: 9 }, (_, cell) => cell).find(
        (cell) =>
          isCoverLoaded(cell, loaded + 1) && !isCoverLoaded(cell, loaded),
      ),
    )
    expect(new Set(order).size).toBe(9)
    expect(order).not.toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8])
  })
})

describe('HERO_STILL', () => {
  it('is the full collection grid', () => {
    expect(HERO_STILL).toEqual({ beat: 'collection', loaded: 9 })
  })
})
