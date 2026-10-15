import 'react'

declare module 'react' {
  interface CSSProperties {
    // Set on record screens from the current Cover (useCoverTint)
    '--cover-tint'?: string
    // The Disc's Vinyl colour (discSurface)
    '--disc-surface'?: string
    // A Sleeve pull slide's distance to the centre (0 centred, 1 a slide away)
    '--pull-distance'?: number
  }
}
