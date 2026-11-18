import { describe, expect, it } from 'vitest'

import { CRAFT_MS } from './craft.score'
import { BAKE_FPS, bakeDom } from './dom-bake'

const bake = bakeDom({ width: 1280, height: 720, framing: 'wide' })
const frames = (CRAFT_MS / 1000) * BAKE_FPS + 1

describe('bakeDom', () => {
  it('samples the score 30 times a second, one keyframe per sample on every track', () => {
    expect(frames).toBe(301)
    for (const [name, track] of Object.entries(bake.tracks)) {
      for (const values of Object.values(track)) {
        expect(values, name).toHaveLength(frames)
      }
    }
  })

  it('is pure: the same stage bakes the same keyframes', () => {
    expect(bakeDom({ width: 1280, height: 720, framing: 'wide' })).toEqual(bake)
  })

  it('opens on the page ground and fades up', () => {
    const exposure = bake.tracks.exposure.opacity ?? []
    expect(exposure[0]).toBe(1)
    expect(exposure.at(-1)).toBe(0)
  })

  it('shades every visible jacket face and lets its edges catch the key as the camera moves', () => {
    for (const face of ['spine', 'top', 'mouth', 'bevel-left', 'bevel-top']) {
      expect(bake.tracks[`hero-shade-${face}`].opacity).toHaveLength(frames)
    }
    const glints = [
      'spine',
      'mouth',
      'top',
      'bevel-left',
      'bevel-right',
      'bevel-top',
    ].flatMap((face) => bake.tracks[`hero-glint-${face}`].opacity ?? [])
    // Some edge flares at some point in the shot, and not all the time
    expect(Math.max(...glints)).toBeGreaterThan(0.3)
    expect(Math.min(...glints)).toBeLessThan(0.05)
  })

  it('re-frames 4:5 with its own lens, not a scaled 16:9', () => {
    const tall = bakeDom({ width: 576, height: 720, framing: 'tall' })
    expect(tall.perspective).not.toBeCloseTo(bake.perspective)
    expect(tall.tracks.world.transform?.at(-1)).not.toBe(
      bake.tracks.world.transform?.at(-1),
    )
  })
})
