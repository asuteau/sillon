import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

import {
  APPLE_TOUCH_ICON,
  LACQUER_STOPS,
  PWA_ICONS,
  VINYL_BLACK,
  brandArtSvg,
  manifestIcons,
  markExtent,
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

  it('mirrors --vinyl-black in styles.css', () => {
    expect(css).toContain(`--vinyl-black: ${VINYL_BLACK};`)
  })
})
