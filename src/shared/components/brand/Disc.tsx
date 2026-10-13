import type { ReactNode } from 'react'

interface DiscProps {
  /** CSS background under the grooves: the Vinyl colour. Black by default */
  surface?: string
  /** See-through vinyl: the page shows through, a rim keeps the edge */
  seeThrough?: boolean
  /** Printed on a picture disc, under the label: the Cover */
  picture?: ReactNode
}

// The record itself, a brand object (design system §5, Sleeve pull): vinyl
// with grooves and a sheen, the label in the Cover tint (--cover-tint set on
// an ancestor; grey for House sleeves) and the centre hole. Spans, so it can
// sit inside a button. Sized and placed by its container.
export const Disc = ({ surface, seeThrough, picture }: DiscProps) => (
  <span
    aria-hidden
    className="disc"
    data-see-through={seeThrough || undefined}
    style={{ '--disc-surface': surface }}
  >
    <span className="disc-grooves">
      {picture && <span className="disc-picture">{picture}</span>}
      <span className="disc-label" />
      <span className="disc-hole" />
    </span>
    <span className="disc-sheen" />
  </span>
)
