// Renders the favicon, PWA icons, iOS launch screens and README banners from
// the groove mark.
// Re-run after tweaking the mark: pnpm generate:pwa-assets
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Resvg } from '@resvg/resvg-js'

import { encodeIco } from '../src/shared/utils/ico'
import {
  APPLE_TOUCH_ICON,
  FAVICON,
  FAVICON_ICO_SIZES,
  PWA_ICONS,
  STARTUP_MARK_RATIO,
  brandArtSvg,
  brandIconSvg,
  readmeBannerSvg,
} from '../src/shared/utils/pwa-assets'
import {
  IOS_STARTUP_IMAGES,
  startupImageFile,
} from '../src/shared/utils/startup-images'

const scriptsDir = dirname(fileURLToPath(import.meta.url))
const rootDir = resolve(scriptsDir, '..')

// File under the repo root; defaults to public/
const write = (file: string, data: string | Uint8Array, dir = 'public') => {
  const path = resolve(rootDir, dir, file)
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, data)
  console.log(`✓ ${dir}/${file}`)
}

// resvg can't read WOFF2 or pick a variable font's weight, so text renders
// from static TTF instances of the self-hosted family
const FONT_FILES = [400, 700].map((weight) =>
  resolve(scriptsDir, `fonts/familjen-grotesk-${weight}.ttf`),
)

const renderPng = (svg: string, width?: number): Uint8Array =>
  new Resvg(svg, {
    ...(width && { fitTo: { mode: 'width', value: width } }),
    font: { fontFiles: FONT_FILES, loadSystemFonts: false },
  })
    .render()
    .asPng()

const faviconSvg = brandIconSvg(FAVICON)
write(FAVICON.file, faviconSvg)
write(
  'favicon.ico',
  encodeIco(
    FAVICON_ICO_SIZES.map((size) => ({
      size,
      png: renderPng(faviconSvg, size),
    })),
  ),
)

for (const icon of [...PWA_ICONS, APPLE_TOUCH_ICON]) {
  write(icon.file, renderPng(brandIconSvg(icon)))
}

for (const image of IOS_STARTUP_IMAGES) {
  const width = image.width * image.pixelRatio
  const height = image.height * image.pixelRatio
  const markSize = Math.round(width * STARTUP_MARK_RATIO)
  write(
    startupImageFile(image),
    renderPng(brandArtSvg({ width, height, markSize })),
  )
}

for (const theme of ['light', 'dark'] as const) {
  write(
    `readme-banner-${theme}.png`,
    renderPng(readmeBannerSvg(theme)),
    'docs/brand',
  )
}
