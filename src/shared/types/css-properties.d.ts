import 'react'

declare module 'react' {
  interface CSSProperties {
    // Set on record screens from the current Cover (useCoverTint)
    '--cover-tint'?: string
    // The Disc's Vinyl colour (discSurface)
    '--disc-surface'?: string
  }
}
