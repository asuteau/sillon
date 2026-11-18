import { describe, expect, it } from 'vitest'

import { HERO_CAST, LANDING_RECORDS } from './content/landing.content'
import { coverArt } from './cover-art.utils'

const THEMES = ['light', 'dark'] as const

const lightness = (colour: string) =>
  Number(/oklch\(([\d.]+)/.exec(colour)?.[1])

describe('coverArt', () => {
  it('draws the same art for the same seed every time', () => {
    for (const theme of THEMES)
      expect(coverArt(7, theme)).toEqual(coverArt(7, theme))
  })

  it('draws different art for each member of the cast', () => {
    for (const theme of THEMES) {
      const arts = HERO_CAST.map(({ index }) =>
        JSON.stringify(coverArt(104_101 + index, theme)),
      )
      expect(new Set(arts).size).toBe(HERO_CAST.length)
    }
    const all = LANDING_RECORDS.map((_, i) =>
      JSON.stringify(coverArt(104_101 + i, 'light')),
    )
    expect(new Set(all).size).toBe(LANDING_RECORDS.length)
  })

  it('works in light and dark: a ground, shapes and ink, the grounds differ', () => {
    for (const theme of THEMES) {
      const art = coverArt(104_103, theme)
      expect(art.ground).toMatch(/^oklch\(/)
      expect(art.ink).toMatch(/^oklch\(/)
      expect(art.shapes.length).toBeGreaterThan(0)
    }
    expect(coverArt(104_103, 'light').ground).not.toBe(
      coverArt(104_103, 'dark').ground,
    )
  })

  it('keeps the type readable: ink is far from the ground in lightness', () => {
    for (const theme of THEMES)
      for (let seed = 1; seed <= 20; seed++) {
        const { ground, ink } = coverArt(seed, theme)
        expect(Math.abs(lightness(ground) - lightness(ink))).toBeGreaterThan(
          0.4,
        )
      }
  })
})
