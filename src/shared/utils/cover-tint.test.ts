import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

import { blend, contrastRatio, hexToRgb, oklchToRgb } from './colour'
import { TINT_LIGHTNESS, TINT_MAX_CHROMA, dominantTint } from './cover-tint'

// `n` pixels of one colour, as RGBA bytes
const px = (n: number, r: number, g: number, b: number, a = 255) =>
  Array.from({ length: n }, () => [r, g, b, a]).flat()

const pixels = (...runs: number[][]) => Uint8ClampedArray.from(runs.flat())

describe('dominantTint', () => {
  it('returns the cover colour, muted', () => {
    const tint = dominantTint(pixels(px(20, 220, 30, 40)))

    expect(tint).not.toBeNull()
    expect(tint!.l).toBe(TINT_LIGHTNESS)
    expect(tint!.c).toBeLessThanOrEqual(TINT_MAX_CHROMA)
    expect(tint!.c).toBeGreaterThan(0.05)
    // red sits around 25° in OKLCH
    expect(tint!.h).toBeGreaterThan(10)
    expect(tint!.h).toBeLessThan(40)
  })

  it('picks the dominant colour over near-black and near-white', () => {
    const tint = dominantTint(
      pixels(px(50, 5, 5, 5), px(30, 250, 250, 250), px(20, 30, 60, 200)),
    )

    // blue sits around 265° in OKLCH
    expect(tint!.h).toBeGreaterThan(240)
    expect(tint!.h).toBeLessThan(290)
  })

  it('picks the larger of two colours', () => {
    const tint = dominantTint(pixels(px(30, 40, 160, 60), px(10, 220, 30, 40)))

    // green sits around 145° in OKLCH
    expect(tint!.h).toBeGreaterThan(120)
    expect(tint!.h).toBeLessThan(170)
  })

  it('is grey for a grey cover', () => {
    const tint = dominantTint(pixels(px(20, 120, 120, 118)))

    expect(tint).toEqual({ l: TINT_LIGHTNESS, c: 0, h: 0 })
  })

  it('is grey when colour is only a speck', () => {
    const tint = dominantTint(pixels(px(95, 120, 120, 120), px(5, 220, 30, 40)))

    expect(tint!.c).toBe(0)
  })

  it('is null when nothing can be sampled', () => {
    expect(dominantTint(pixels())).toBeNull()
    expect(dominantTint(pixels(px(10, 220, 30, 40, 0)))).toBeNull()
  })
})

// The glow is drawn behind the record heading: text must stay AA on it
describe('cover glow contrast', () => {
  const css = readFileSync(
    join(import.meta.dirname, '../../styles.css'),
    'utf8',
  )

  const token = (block: string, name: string) => {
    const match = block.match(new RegExp(`--${name}:\\s*([^;]+);`))
    if (!match) throw new Error(`--${name} missing`)
    return match[1].trim()
  }

  const glow = (block: string) => ({
    l: Number(token(block, 'cover-glow-lightness')),
    alpha: Number(token(block, 'cover-glow-alpha')),
  })

  const lightBlock = css.slice(css.indexOf(':root {'))
  const darkBlock = css.slice(css.indexOf('.dark {'))

  const themes = [
    { name: 'light', block: lightBlock },
    { name: 'dark', block: darkBlock },
  ]

  const hues = Array.from({ length: 24 }, (_, i) => i * 15)

  it.each(themes)('keeps text AA on the glow in $name', ({ block }) => {
    const { l, alpha } = glow(block)
    const popover = hexToRgb(token(block, 'popover'))

    for (const name of ['foreground', 'muted-foreground']) {
      const text = hexToRgb(token(block, name))
      for (const c of [0, TINT_MAX_CHROMA])
        for (const h of hues) {
          const peak = blend(popover, oklchToRgb({ l, c, h }), alpha)
          expect(
            contrastRatio(text, peak),
            `${name} on ${c}/${h}`,
          ).toBeGreaterThanOrEqual(4.5)
        }
    }
  })

  it('defines the glow in both dark blocks alike', () => {
    const media = css.slice(css.indexOf('@media (prefers-color-scheme: dark)'))
    expect(glow(media)).toEqual(glow(darkBlock))
  })
})
