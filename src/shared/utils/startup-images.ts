// iOS launch screens (apple-touch-startup-image): one portrait PNG per iPhone
// viewport, rendered by scripts/generate-pwa-assets.ts and linked from
// __root.tsx. Kept apart from pwa-assets.ts so the client only gets the table.

export interface StartupImage {
  /** Portrait viewport in CSS px */
  width: number
  height: number
  pixelRatio: number
}

// Current iPhone portrait viewports, largest first
export const IOS_STARTUP_IMAGES: StartupImage[] = [
  { width: 440, height: 956, pixelRatio: 3 }, // 16 Pro Max, 17 Pro Max
  { width: 430, height: 932, pixelRatio: 3 }, // 14 Pro Max, 15 Plus/Pro Max, 16 Plus
  { width: 428, height: 926, pixelRatio: 3 }, // 12/13 Pro Max, 14 Plus
  { width: 420, height: 912, pixelRatio: 3 }, // Air
  { width: 414, height: 896, pixelRatio: 2 }, // XR, 11
  { width: 414, height: 896, pixelRatio: 3 }, // XS Max, 11 Pro Max
  { width: 402, height: 874, pixelRatio: 3 }, // 16 Pro, 17, 17 Pro
  { width: 393, height: 852, pixelRatio: 3 }, // 14 Pro, 15, 15 Pro, 16
  { width: 390, height: 844, pixelRatio: 3 }, // 12, 13, 14, 16e
  { width: 375, height: 812, pixelRatio: 3 }, // X, XS, 11 Pro, 12/13 mini
  { width: 375, height: 667, pixelRatio: 2 }, // SE 2nd/3rd gen
]

/** Path under public/ */
export const startupImageFile = ({
  width,
  height,
  pixelRatio,
}: StartupImage): string =>
  `splash/apple-splash-${width * pixelRatio}-${height * pixelRatio}.png`

export const startupImageLinks = () =>
  IOS_STARTUP_IMAGES.map((image) => ({
    rel: 'apple-touch-startup-image',
    href: `/${startupImageFile(image)}`,
    media: `screen and (device-width: ${image.width}px) and (device-height: ${image.height}px) and (-webkit-device-pixel-ratio: ${image.pixelRatio}) and (orientation: portrait)`,
  }))
