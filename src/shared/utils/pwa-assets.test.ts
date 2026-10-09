import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

import {
  APPLE_TOUCH_ICON,
  BANNER_COLOURS,
  LACQUER_STOPS,
  PWA_ICONS,
  README_BANNER,
  VINYL_BLACK,
  brandArtSvg,
  manifestIcons,
  markExtent,
  readmeBannerSvg,
} from './pwa-assets'

describe('brandArtSvg', () => {
  const svg = brandArtSvg({ width: 192, height: 192, markSize: 150 })

  it('draws the groove in lacquer on vinyl black', () => {
    expect(svg).toContain(`fill="${VINYL_BLACK}"`)
    for (const stop of LACQUER_STOPS) expect(svg).toContain(stop)
    expect(svg).toMatch(/<path d="M[\d. L]+"[^>]*stroke="url\(#lacquer\)"/)
    expect(svg).toContain('stroke-linecap="round"')
  })

  it('centres the mark on the canvas', () => {
    const tall = brandArtSvg({ width: 1179, height: 2556, markSize: 300 })
    expect(tall).toContain('width="1179" height="2556"')
    expect(tall).toMatch(/<svg x="439\.5" y="1128" width="300" height="300"/)
  })

  it('uses the turns for the mark size: 2.5 for the favicon', () => {
    const turnsOf = (s: string) => s.split(' L').length - 1
    const favicon = brandArtSvg({ width: 32, height: 32, markSize: 28 })
    // 72 steps per turn
    expect(turnsOf(favicon)).toBe(180)
    expect(turnsOf(svg)).toBe(9 * 72)
  })
})

describe('readmeBannerSvg', () => {
  const dark = readmeBannerSvg('dark')
  const light = readmeBannerSvg('light')

  it('sets each theme on its ground colour', () => {
    expect(dark).toContain(`<rect width="100%" height="100%" fill="#0a0a0b"/>`)
    expect(light).toContain(`<rect width="100%" height="100%" fill="#f5f5f3"/>`)
  })

  it('strokes the groove with all three lacquer stops', () => {
    for (const svg of [dark, light]) {
      for (const stop of LACQUER_STOPS) {
        expect(svg).toContain(`stop-color="${stop}"`)
      }
      expect(svg).toMatch(/<path d="M[\d. L]+"[^>]*stroke="url\(#lacquer\)"/)
    }
  })

  it('sets the wordmark and tagline', () => {
    for (const svg of [dark, light]) {
      expect(svg).toMatch(
        /<text [^>]*font-family="Familjen Grotesk"[^>]*font-weight="700"[^>]*>sillon<\/text>/,
      )
      expect(svg).toMatch(
        /<text [^>]*font-family="Familjen Grotesk"[^>]*font-weight="400"[^>]*>Your Discogs collection, cover first\.<\/text>/,
      )
    }
  })

  it('draws on a 1280×400 canvas', () => {
    expect(README_BANNER).toMatchObject({ width: 1280, height: 400 })
    expect(dark).toContain('width="1280" height="400" viewBox="0 0 1280 400"')
  })
})

describe('PWA icons', () => {
  it('lists 192, 512 and 512 maskable in the manifest', () => {
    expect(manifestIcons()).toEqual([
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512-maskable.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ])
  })

  it('keeps the maskable mark inside the 80% safe zone', () => {
    const maskable = PWA_ICONS.find((icon) => icon.purpose === 'maskable')!
    expect(markExtent(maskable.markSize)).toBeLessThanOrEqual(
      maskable.size * 0.4,
    )
  })

  it('sizes the apple-touch-icon at 180', () => {
    expect(APPLE_TOUCH_ICON.size).toBe(180)
  })
})

describe('brand colours', () => {
  const css = readFileSync(resolve(__dirname, '../../styles.css'), 'utf8')

  it('uses the copper master stops for lacquer', () => {
    expect(LACQUER_STOPS).toEqual(['#f2d3bf', '#b06d4a', '#e6b394'])
  })

  it('mirrors --lacquer-1..3 in styles.css', () => {
    LACQUER_STOPS.forEach((stop, i) => {
      expect(css).toContain(`--lacquer-${i + 1}: ${stop};`)
    })
  })

  it('derives the satin tokens from --lacquer-1..3, not hex', () => {
    const token = (name: string) =>
      css.match(new RegExp(`--lacquer-${name}:([^;]+);`))?.[1] ?? ''
    for (const name of ['satin', 'satin-hover', 'satin-shadow']) {
      expect(token(name)).toMatch(/var\(--lacquer-[123]\)/)
      expect(token(name)).not.toMatch(/#[0-9a-f]{3,8}\b/i)
    }
    expect(token('satin')).toMatch(
      /180deg,\s*var\(--lacquer-1\),\s*var\(--lacquer-3\)/,
    )
  })

  it('mirrors the README banner colours in styles.css', () => {
    const { light, dark } = BANNER_COLOURS
    const darkBlock = css.slice(css.indexOf('.dark {'))
    expect(css).toContain(`--background: ${light.ground};`)
    expect(css).toContain(`--foreground: ${light.ink};`)
    expect(css).toContain(`--muted-foreground: ${light.muted};`)
    expect(darkBlock).toContain(`--foreground: ${dark.ink};`)
    expect(darkBlock).toContain(`--muted-foreground: ${dark.muted};`)
  })

  it('mirrors --vinyl-black in styles.css', () => {
    expect(css).toContain(`--vinyl-black: ${VINYL_BLACK};`)
  })
})
