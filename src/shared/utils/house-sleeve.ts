// A House sleeve: the Cover Sillon generates when a record has no artwork.
// Deterministic per Master — seeded by the cover key when there is one (else
// artist and title, as on the landing page), never by Release details — so
// every Release of a Master gets the same sleeve.

// Modernist sleeve layouts (Blue Note / ECM tradition)
export const SLEEVE_LAYOUTS = [
  'band', // a lacquer band across the sleeve
  'block', // a lacquer square in one corner
  'rules', // groove-spaced rules over half the sleeve
  'circle', // a large lacquer circle cropped by the edge
  'stack', // type only, with a short lacquer rule
] as const

export type SleeveLayout = (typeof SLEEVE_LAYOUTS)[number]

// Greyscale grounds and inks; lacquer is the only accent. Fixed values, not
// theme tokens: a sleeve is an object and looks the same in light and dark.
export const SLEEVE_COMPOSITIONS = [
  { name: 'paper', ground: '#efede8', ink: '#0d0d0e' },
  { name: 'vinyl', ground: '#0a0a0b', ink: '#efede8' },
  { name: 'graphite', ground: '#3a3a39', ink: '#efede8' },
  { name: 'ash', ground: '#b9b8b4', ink: '#0d0d0e' },
] as const

export type SleeveComposition = (typeof SLEEVE_COMPOSITIONS)[number]

// Which corner or edge the layout's shape sits on
export const SLEEVE_PLACEMENTS = [
  'top-left',
  'top-right',
  'bottom-right',
  'bottom-left',
] as const

export type SleevePlacement = (typeof SLEEVE_PLACEMENTS)[number]

export interface HouseSleeveDesign {
  layout: SleeveLayout
  composition: SleeveComposition
  placement: SleevePlacement
}

export interface HouseSleeveRecord {
  artist: string
  title: string
  /** From masterCoverKey / releaseCoverKey */
  coverKey?: string
}

const normalise = (s: string): string =>
  s
    .replace(/\s*\(\d+\)\s*$/, '')
    .trim()
    .toLowerCase()

// FNV-1a, 32-bit
const hash = (s: string): number => {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

export const houseSleeve = ({
  artist,
  title,
  coverKey,
}: HouseSleeveRecord): HouseSleeveDesign => {
  const h = hash(coverKey ?? `${normalise(artist)}␟${normalise(title)}`)
  return {
    layout: SLEEVE_LAYOUTS[h % SLEEVE_LAYOUTS.length],
    composition: SLEEVE_COMPOSITIONS[(h >>> 8) % SLEEVE_COMPOSITIONS.length],
    placement: SLEEVE_PLACEMENTS[(h >>> 16) % SLEEVE_PLACEMENTS.length],
  }
}
