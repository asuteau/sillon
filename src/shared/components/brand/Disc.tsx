// The record itself, a brand object (design system §5, Sleeve pull): black
// vinyl with grooves and a sheen, the label in the Cover tint (--cover-tint
// set on an ancestor; grey for House sleeves) and the centre hole. Spans, so
// it can sit inside a button. Sized and placed by its container.
export const Disc = () => (
  <span aria-hidden className="disc">
    <span className="disc-grooves">
      <span className="disc-label" />
      <span className="disc-hole" />
    </span>
    <span className="disc-sheen" />
  </span>
)
