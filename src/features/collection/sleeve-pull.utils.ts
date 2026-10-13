// Signature 3 — Sleeve pull: the geometry the strip writes on every scroll
// frame. Pure, so the motion follows the finger without React renders.

interface PullDistanceInput {
  slideCentre: number
  stripCentre: number
  // Centre-to-centre distance between two slides
  step: number
}

// How far a slide is from the strip's centre, in slides: 0 when centred
// (disc fully out), 1 from a neighbour away (disc in, scaled down, dimmed)
export const pullDistance = ({
  slideCentre,
  stripCentre,
  step,
}: PullDistanceInput): number =>
  Math.min(1, Math.abs(slideCentre - stripCentre) / step)

// The centred slide: the one nearest the strip's centre, the first on a tie
export const nearestSlide = (
  slideCentres: number[],
  stripCentre: number,
): number => {
  let nearest = 0
  slideCentres.forEach((centre, index) => {
    if (
      Math.abs(centre - stripCentre) <
      Math.abs(slideCentres[nearest] - stripCentre)
    )
      nearest = index
  })
  return nearest
}

const twoDigits = (n: number) => String(n).padStart(2, '0')

// Catalogue line of the caption: "03 / 10"
export const slidePosition = (index: number, count: number): string =>
  `${twoDigits(index + 1)} / ${twoDigits(count)}`

interface CentredAfterChangeInput {
  // The strip's Copies, newest first, after the change
  ids: number[]
  // The Copy centred before it, and where it was
  centredId: number
  centredIndex: number
}

// The slide to centre once the strip's Copies change. Removing the centred
// Copy brings the next older one into its place, or the previous one when it
// was the last; null when nothing is left.
export const centredAfterChange = ({
  ids,
  centredId,
  centredIndex,
}: CentredAfterChangeInput): number | null => {
  if (ids.length === 0) return null
  const index = ids.indexOf(centredId)
  if (index !== -1) return index
  return Math.min(centredIndex, ids.length - 1)
}

const bezier = (t: number, p1: number, p2: number) =>
  3 * (1 - t) ** 2 * t * p1 + 3 * (1 - t) * t ** 2 * p2 + t ** 3

// --ease-platter, cubic-bezier(.65, 0, .15, 1), for moves scripted frame by
// frame (scroll position can't take a CSS easing). Progress in, eased out.
export const platterEase = (progress: number): number => {
  if (progress <= 0) return 0
  if (progress >= 1) return 1
  // x(t) only grows: bisect for the t that gives this progress
  let low = 0
  let high = 1
  for (let i = 0; i < 30; i++) {
    const t = (low + high) / 2
    if (bezier(t, 0.65, 0.15) < progress) low = t
    else high = t
  }
  return bezier((low + high) / 2, 0, 1)
}
