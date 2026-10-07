// Renders the favicon, PWA icons and iOS launch screens from the groove mark.
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
} from '../src/shared/utils/pwa-assets'
import {
  IOS_STARTUP_IMAGES,
  startupImageFile,
} from '../src/shared/utils/startup-images'

const publicDir = resolve(dirname(fileURLToPath(import.meta.url)), '../public')

const write = (file: string, data: string | Uint8Array) => {
  const path = resolve(publicDir, file)
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, data)
  console.log(`✓ public/${file}`)
}

const renderPng = (svg: string, width?: number): Uint8Array =>
  new Resvg(svg, width ? { fitTo: { mode: 'width', value: width } } : {})
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
