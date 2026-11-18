// Original Cover art for the landing page's made-up records, generated in
// code like the Disc's surface: seeded by the pressing id, so a record always
// looks the same, abstract shapes under typeset type, no image asset and no
// third-party art. Pure; the theme picks the ground and ink, not the layout.
import { seededRandom } from '#/features/collection/disc-surface.utils'

export type CoverTheme = 'light' | 'dark'

export interface CoverArt {
  ground: string
  ink: string
  // CSS gradients, drawn over the ground, top first
  shapes: string[]
}

type Random = () => number

const round = (n: number) => Math.round(n * 10) / 10

const oklch = (l: number, c: number, h: number, alpha = 1) =>
  `oklch(${round(l * 100) / 100} ${round(c * 1000) / 1000} ${Math.round(h)}${alpha < 1 ? ` / ${alpha}` : ''})`

interface Palette {
  hue: number
  // The seed's colours: an accent and a partner, the ground's tint
  accent: string
  partner: string
}

// Light covers sit on a pale ground with deep shapes, dark on a deep ground
// with luminous ones, so each reads on its own page ground
const paletteOf = (next: Random, theme: CoverTheme): Palette => {
  const hue = next() * 360
  const partnerHue = (hue + 40 + next() * 140) % 360
  const dark = theme === 'dark'
  return {
    hue,
    accent: oklch(dark ? 0.72 : 0.55, 0.14 + next() * 0.06, hue),
    partner: oklch(dark ? 0.58 : 0.74, 0.1 + next() * 0.06, partnerHue),
  }
}

const circle = (colour: string, next: Random) =>
  `radial-gradient(circle at ${round(15 + next() * 70)}% ${round(15 + next() * 70)}%, ${colour} ${round(14 + next() * 22)}%, transparent ${round(14.4 + next() * 22)}%)`

const band = (colour: string, next: Random) => {
  const [from, to] = [round(10 + next() * 40), round(52 + next() * 30)]
  return `linear-gradient(${next() < 0.5 ? 0 : 90}deg, transparent ${from}%, ${colour} ${from}% ${to}%, transparent ${to}%)`
}

const stripes = (colour: string, next: Random) =>
  `repeating-linear-gradient(${Math.round(next() * 180)}deg, ${colour} 0 ${round(1 + next() * 2)}%, transparent 0 ${round(7 + next() * 6)}%)`

const sunburst = (colour: string, next: Random) =>
  `repeating-conic-gradient(from ${Math.round(next() * 90)}deg at ${round(20 + next() * 60)}% ${round(20 + next() * 60)}%, ${colour} 0 ${round(2 + next() * 3)}deg, transparent 0 ${round(12 + next() * 8)}deg)`

const SHAPES = [circle, band, stripes, sunburst]

export const coverArt = (seed: number, theme: CoverTheme): CoverArt => {
  const next = seededRandom(seed)
  const { hue, accent, partner } = paletteOf(next, theme)
  const dark = theme === 'dark'
  const pick = () => SHAPES[Math.floor(next() * SHAPES.length)]
  const [first, second] = [pick(), pick()]
  return {
    ground: oklch(dark ? 0.2 : 0.94, 0.03, hue),
    ink: oklch(dark ? 0.95 : 0.2, 0.02, hue),
    shapes: [second(partner, next), first(accent, next), circle(accent, next)],
  }
}
