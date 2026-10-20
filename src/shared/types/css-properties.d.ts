import 'react'

declare module 'react' {
  interface CSSProperties {
    // Set on record screens from the current Cover (useCoverTint)
    '--cover-tint'?: string
    // The Disc's Vinyl colour (discSurface)
    '--disc-surface'?: string
    // A Sleeve pull slide's distance to the centre (0 centred, 1 a slide away)
    '--pull-distance'?: number
    // How much of the landing hero's groove is still to draw (1 none drawn)
    '--groove-undrawn'?: number
    // The landing hero stage's layout, in cqw (HERO_STAGE_VARS)
    '--hero-sleeve'?: string
    '--hero-slide-y'?: string
    '--hero-groove'?: string
    '--hero-cover'?: string
    '--hero-cover-y'?: string
  }
}
