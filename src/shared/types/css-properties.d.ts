import 'react'

declare module 'react' {
  interface CSSProperties {
    // Set on record screens from the current Cover (useCoverTint)
    '--cover-tint'?: string
    // A generated Cover's ink, in light and dark (landing GeneratedCover)
    '--ink-light'?: string
    '--ink-dark'?: string
    // The Disc's Vinyl colour (discSurface)
    '--disc-surface'?: string
    // A Sleeve pull slide's distance to the centre (0 centred, 1 a slide away)
    '--pull-distance'?: number
    // How much of the landing hero's groove is still to draw (1 none drawn)
    '--groove-undrawn'?: number
    // A landing hero sleeve's edges and bevels, in light and dark, and the
    // paper of its back (HeroSet)
    '--edge-light'?: string
    '--edge-dark'?: string
    '--bevel-light'?: string
    '--bevel-dark'?: string
    '--paper'?: string
    // The landing Collection loop's layout, in cqw (COLLECTION_STAGE_VARS)
    '--loop-sleeve'?: string
    '--loop-slide-y'?: string
    '--loop-cover'?: string
    '--loop-cover-y'?: string
  }
}
