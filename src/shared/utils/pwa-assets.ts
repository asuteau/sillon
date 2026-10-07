// Brand art for the favicon, PWA icons and iOS launch screens: the lacquer
// groove centred on vinyl black. Rendered to files by
// scripts/generate-pwa-assets.ts.

import {
  GROOVE_INNER_RADIUS,
  GROOVE_OUTER_RADIUS,
  grooveSpiralPath,
  grooveStrokeWidth,
  grooveTurnsForSize,
} from './groove-spiral'

/** Same as --vinyl-black; the launch screen is always dark, whatever the theme */
export const VINYL_BLACK = '#0a0a0b'

/** Same stops as --lacquer-1..3 in styles.css (checked by a test) */
export const LACQUER_STOPS = ['#e6e8eb', '#9a9ea5', '#cfd2d6'] as const

interface BrandArtOptions {
  width: number
  height: number
  /** Rendered size of the mark in px; also sets its turns and stroke */
  markSize: number
}

export const brandArtSvg = ({
  width,
  height,
  markSize,
}: BrandArtOptions): string => {
  const d = grooveSpiralPath({
    turns: grooveTurnsForSize(markSize),
    innerRadius: GROOVE_INNER_RADIUS,
    outerRadius: GROOVE_OUTER_RADIUS,
  })
  const x = (width - markSize) / 2
  const y = (height - markSize) / 2
  const [stop1, stop2, stop3] = LACQUER_STOPS

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
    `<rect width="100%" height="100%" fill="${VINYL_BLACK}"/>`,
    `<svg x="${x}" y="${y}" width="${markSize}" height="${markSize}" viewBox="0 0 100 100">`,
    // Same gradient as GrooveMark's lacquer tone
    `<defs><linearGradient id="lacquer" x1="0" y1="0.2" x2="1" y2="0.8">`,
    `<stop offset="0" stop-color="${stop1}"/><stop offset="0.6" stop-color="${stop2}"/><stop offset="1" stop-color="${stop3}"/>`,
    `</linearGradient></defs>`,
    `<path d="${d}" fill="none" stroke="url(#lacquer)" stroke-width="${grooveStrokeWidth(markSize).toFixed(2)}" stroke-linecap="round"/>`,
    `</svg></svg>`,
  ].join('')
}

/** Radius in px from the centre to the outer edge of the drawn groove */
export const markExtent = (markSize: number): number =>
  ((GROOVE_OUTER_RADIUS + grooveStrokeWidth(markSize) / 2) / 100) * markSize

interface BrandIcon {
  /** Path under public/ */
  file: string
  size: number
  markSize: number
}

/** Favicon SVG canvas; the ICO is rasterised from it */
export const FAVICON: BrandIcon = {
  file: 'favicon.svg',
  size: 32,
  markSize: 29,
}
export const FAVICON_ICO_SIZES = [16, 32, 48] as const

export const PWA_ICONS: (BrandIcon & { purpose: 'any' | 'maskable' })[] = [
  { file: 'icons/icon-192.png', size: 192, markSize: 154, purpose: 'any' },
  { file: 'icons/icon-512.png', size: 512, markSize: 410, purpose: 'any' },
  // Launchers crop to as little as the centre 80% circle
  {
    file: 'icons/icon-512-maskable.png',
    size: 512,
    markSize: 368,
    purpose: 'maskable',
  },
]

// iOS rounds the corners itself; no transparency allowed
export const APPLE_TOUCH_ICON: BrandIcon = {
  file: 'icons/apple-touch-icon.png',
  size: 180,
  markSize: 130,
}

export const manifestIcons = () =>
  PWA_ICONS.map(({ file, size, purpose }) => ({
    src: `/${file}`,
    sizes: `${size}x${size}`,
    type: 'image/png',
    purpose,
  }))

/** Square canvas, mark centred */
export const brandIconSvg = ({ size, markSize }: BrandIcon): string =>
  brandArtSvg({ width: size, height: size, markSize })

/** Groove width as a share of the launch screen's short side */
export const STARTUP_MARK_RATIO = 0.3
