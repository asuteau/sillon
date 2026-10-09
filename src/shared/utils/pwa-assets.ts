// Brand art for the favicon, PWA icons, iOS launch screens and README banner:
// the lacquer groove on vinyl black (or the light ground for the banner).
// Rendered to files by scripts/generate-pwa-assets.ts.

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
export const LACQUER_STOPS = ['#f2d3bf', '#b06d4a', '#e6b394'] as const

interface BrandArtOptions {
  width: number
  height: number
  /** Rendered size of the mark in px; also sets its turns and stroke */
  markSize: number
}

/** The lacquer groove as a nested svg, markSize px square at (x, y) */
const grooveMarkSvg = (x: number, y: number, markSize: number): string => {
  const d = grooveSpiralPath({
    turns: grooveTurnsForSize(markSize),
    innerRadius: GROOVE_INNER_RADIUS,
    outerRadius: GROOVE_OUTER_RADIUS,
  })
  const [stop1, stop2, stop3] = LACQUER_STOPS

  return [
    `<svg x="${x}" y="${y}" width="${markSize}" height="${markSize}" viewBox="0 0 100 100">`,
    // Same gradient as GrooveMark's lacquer tone
    `<defs><linearGradient id="lacquer" x1="0" y1="0.2" x2="1" y2="0.8">`,
    `<stop offset="0" stop-color="${stop1}"/><stop offset="0.6" stop-color="${stop2}"/><stop offset="1" stop-color="${stop3}"/>`,
    `</linearGradient></defs>`,
    `<path d="${d}" fill="none" stroke="url(#lacquer)" stroke-width="${grooveStrokeWidth(markSize).toFixed(2)}" stroke-linecap="round"/>`,
    `</svg>`,
  ].join('')
}

const canvasSvg = (width: number, height: number, ground: string) =>
  [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
    `<rect width="100%" height="100%" fill="${ground}"/>`,
  ].join('')

export const brandArtSvg = ({
  width,
  height,
  markSize,
}: BrandArtOptions): string =>
  [
    canvasSvg(width, height, VINYL_BLACK),
    grooveMarkSvg((width - markSize) / 2, (height - markSize) / 2, markSize),
    `</svg>`,
  ].join('')

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

type BannerTheme = 'light' | 'dark'

/** Cover banner at the top of the README; rendered to docs/brand/ */
export const README_BANNER = { width: 1280, height: 400, markSize: 288 }

const README_TAGLINE = 'Your Discogs collection, cover first.'

// Ground and ink per theme: vinyl black on dark, --background /
// --foreground / --muted-foreground on light
export const BANNER_COLOURS: Record<
  BannerTheme,
  { ground: string; ink: string; muted: string }
> = {
  dark: { ground: VINYL_BLACK, ink: '#ebeae7', muted: '#8b8a87' },
  light: { ground: '#f5f5f3', ink: '#141413', muted: '#6b6b69' },
}

/** Groove on the left, wordmark and tagline on the right */
export const readmeBannerSvg = (theme: BannerTheme): string => {
  const { width, height, markSize } = README_BANNER
  const { ground, ink, muted } = BANNER_COLOURS[theme]
  const markX = 112
  const textX = markX + markSize + 80
  const wordmarkSize = 152

  return [
    canvasSvg(width, height, ground),
    grooveMarkSvg(markX, (height - markSize) / 2, markSize),
    // Wordmark component: bold, lowercase, tracking -0.055em
    `<text x="${textX}" y="212" font-family="Familjen Grotesk" font-weight="700" font-size="${wordmarkSize}" letter-spacing="${(-0.055 * wordmarkSize).toFixed(2)}" fill="${ink}">sillon</text>`,
    `<text x="${textX + 6}" y="276" font-family="Familjen Grotesk" font-weight="400" font-size="36" fill="${muted}">${README_TAGLINE}</text>`,
    `</svg>`,
  ].join('')
}
