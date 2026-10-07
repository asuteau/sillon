import { describe, expect, it } from 'vitest'

import { IOS_STARTUP_IMAGES, startupImageLinks } from './startup-images'

describe('startupImageLinks', () => {
  it('links one portrait launch screen per iPhone size', () => {
    const links = startupImageLinks()
    expect(links).toHaveLength(IOS_STARTUP_IMAGES.length)
    expect(links).toContainEqual({
      rel: 'apple-touch-startup-image',
      href: '/splash/apple-splash-1179-2556.png',
      media:
        'screen and (device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)',
    })
  })

  it('has no duplicate device sizes', () => {
    const hrefs = startupImageLinks().map((link) => link.href)
    expect(new Set(hrefs).size).toBe(hrefs.length)
  })
})
