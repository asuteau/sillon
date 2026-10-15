import type { ReleaseFormat } from '#/features/collection/collection.schema'
import { discSurface } from '#/features/collection/disc-surface.utils'
import { vinylColours } from '#/features/collection/vinyl-colour.utils'
import { Disc } from '#/shared/components/brand/Disc'
import { useMemo } from 'react'

// Beyond this, the row says how many discs there are
const MAX_DISCS = 4

interface DiscRowProps {
  releaseId: number
  formats: ReleaseFormat[]
  /** Printed on a picture disc: the Cover */
  picture: React.ReactNode
}

// The record screen's disc row (design system §5): one Disc per disc of the
// Release, each in its own Vinyl colour. Decorative: the catalogue line says
// the same in words
export const DiscRow = ({ releaseId, formats, picture }: DiscRowProps) => {
  // Disc 1 shares the Sleeve pull's seed; the others get their own pattern
  const surfaces = useMemo(
    () =>
      vinylColours(formats).map((colour, i) =>
        discSurface(colour, releaseId + i),
      ),
    [formats, releaseId],
  )

  if (surfaces.length === 0) return null

  const shown = surfaces.slice(0, MAX_DISCS)

  return (
    <div aria-hidden className="disc-row">
      {shown.map((surface, i) => (
        <span
          key={i}
          className="disc-row-slot"
          // Disc 1 on top, each next one tucked under the one before
          style={{ zIndex: shown.length - i }}
        >
          <Disc
            surface={surface.background}
            seeThrough={surface.seeThrough}
            picture={surface.picture && picture}
          />
        </span>
      ))}
      {surfaces.length > MAX_DISCS && (
        <span className="type-catalogue ml-2 text-xs text-foreground">
          ×{surfaces.length}
        </span>
      )}
    </div>
  )
}
