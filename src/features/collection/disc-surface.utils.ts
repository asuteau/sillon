// The Disc's surface (design system §5): a Vinyl colour drawn as static CSS
// gradients, under the grooves and sheen the Disc lays on top. Pure, seeded
// by the Release id so a Release's splatter and marbling never change.
import type {
  VinylColour,
  VinylEffect,
  VinylHue,
  VinylMaterial,
} from './vinyl-colour.utils'

export interface DiscSurface {
  // A CSS background, layers top first
  background: string
  // Some of it is see-through: the page shows through, the rim keeps its edge
  seeThrough: boolean
  // A picture disc: the Cover is printed on the disc
  picture: boolean
}

const BLACK = '#0a0a0b'
const WHITE = '#f2f0ea'

// Small, fast, good enough for dots: mulberry32
const seededRandom = (seed: number) => {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

type Random = () => number

const round = (n: number) => Math.round(n * 10) / 10

// Where a seeded gradient starts turning
const angle = (next: Random) => `${Math.round(next() * 360)}deg`

// Clear vinyl is barely there; a coloured translucent keeps its colour
const paint = (hue: VinylHue) =>
  hue.translucent
    ? `color-mix(in oklab, ${hue.render} ${hue.family === 'clear' ? 35 : 60}%, transparent)`
    : hue.render

const isLight = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 140
}

// A second colour when the note names one only: "Violet Marbled"
const shadeOf = (hue: VinylHue): VinylHue => ({
  ...hue,
  render: isLight(hue.render) ? BLACK : WHITE,
  translucent: false,
})

// A point on the disc between the label's edge and the rim, in % of the box
const onRecord = (next: Random, inner = 18, outer = 47) => {
  const turn = next() * Math.PI * 2
  const distance = inner + next() * (outer - inner)
  return {
    x: round(50 + Math.cos(turn) * distance),
    y: round(50 + Math.sin(turn) * distance),
  }
}

const dot = (colour: string, x: number, y: number, size: number, soft = 0.6) =>
  `radial-gradient(circle at ${x}% ${y}%, ${colour} ${round(size)}%, transparent ${round(size + soft)}%)`

// Flung paint: a few large drops, each with satellites, in the dots' colours
const splatter = (dots: VinylHue[], next: Random) =>
  Array.from({ length: 12 }, (_, i) => {
    const colour = paint(dots[i % dots.length])
    const { x, y } = onRecord(next)
    const drop = dot(colour, x, y, 1.6 + next() * 2.6)
    const satellites = Array.from({ length: 2 }, () =>
      dot(
        colour,
        round(x + (next() - 0.5) * 12),
        round(y + (next() - 0.5) * 12),
        0.5 + next() * 0.9,
        0.4,
      ),
    )
    return [drop, ...satellites]
  }).flat()

const marbled = ([base, ...veins]: VinylHue[], next: Random) => {
  const colours = veins.length > 0 ? veins : [shadeOf(base)]
  const swirls = colours.flatMap((hue) =>
    Array.from({ length: 2 }, () => {
      const { x, y } = onRecord(next, 12, 36)
      const [w, h] = [18 + next() * 26, 10 + next() * 18]
      return `radial-gradient(ellipse ${round(w)}% ${round(h)}% at ${x}% ${y}%, ${paint(hue)}, transparent 70%)`
    }),
  )
  const stops = colours
    .flatMap((hue, i) => {
      const at = ((i + 0.5) / colours.length) * 100
      return [
        `${paint(base)} ${round(at - 14)}%`,
        `${paint(hue)} ${round(at)}%`,
        `${paint(base)} ${round(at + 14)}%`,
      ]
    })
    .join(', ')
  return [
    ...swirls,
    `conic-gradient(from ${angle(next)}, ${paint(base)}, ${stops}, ${paint(base)})`,
  ]
}

// Hard stops, each colour an equal share
const sectors = (colours: VinylHue[]) =>
  colours
    .map((hue, i) => {
      const [from, to] = [i, i + 1].map((n) =>
        round((n / colours.length) * 100),
      )
      return `${paint(hue)} ${from}% ${to}%`
    })
    .join(', ')

const split = (colours: VinylHue[]) => [
  `linear-gradient(90deg, ${sectors(colours.length > 1 ? colours : [colours[0], shadeOf(colours[0])])})`,
]

// Colour-in-colour: the second colour fills the centre, the base the rim
const yolk = ([base, centre = shadeOf(base)]: VinylHue[]) => [
  `radial-gradient(circle closest-side, ${paint(centre)} 62%, transparent 62.6%)`,
  paint(base),
]

// The base at the centre bleeds into a ring of the second colour
const corona = ([base, ring = shadeOf(base)]: VinylHue[]) => [
  `radial-gradient(circle closest-side, transparent 48%, ${paint(ring)} 74%, ${paint(ring)})`,
  paint(base),
]

// Ink dropped on the centre, spreading in soft lobes
const inkSpot = ([base, ink = shadeOf(base)]: VinylHue[], next: Random) => [
  ...Array.from({ length: 4 }, () => {
    const { x, y } = onRecord(next, 6, 16)
    return `radial-gradient(circle at ${x}% ${y}%, ${paint(ink)} ${round(16 + next() * 8)}%, transparent ${round(30 + next() * 8)}%)`
  }),
  paint(base),
]

// Blades from the centre: three or more colours, or two twice over
const propeller = (colours: VinylHue[], next: Random) => {
  const [base, other = shadeOf(base)] = colours
  const blades = colours.length >= 3 ? colours : [base, other, base, other]
  return [`conic-gradient(from ${angle(next)}, ${sectors(blades)})`]
}

// Two colours wound into each other, soft-edged arms
const twister = ([base, other = shadeOf(base)]: VinylHue[], next: Random) => {
  const arms = [base, other, base, other, base, other, base]
  return [`conic-gradient(from ${angle(next)}, ${arms.map(paint).join(', ')})`]
}

// Etched side: fine lines fanning out over the colour
const etched = ([base]: VinylHue[]) => [
  'repeating-conic-gradient(oklch(1 0 0 / 0.08) 0 0.6deg, transparent 0.6deg 3deg)',
  paint(base),
]

type Layers = (colours: VinylHue[], next: Random) => string[]

const solid: Layers = ([base]) => [paint(base)]

// A hybrid's effect takes the colours it needs, the splatter the rest
// (none left: black or white drops)
const withSplatter =
  (effect: Layers, takes: number): Layers =>
  (colours, next) => {
    const dots = colours.slice(takes)
    const base = effect(colours.slice(0, takes), next)
    return [
      ...splatter(dots.length > 0 ? dots : [shadeOf(colours[0])], next),
      ...base,
    ]
  }

const EFFECTS: Record<VinylEffect, Layers> = {
  solid,
  splatter: withSplatter(solid, 1),
  marbled,
  split,
  corona,
  'ink-spot': inkSpot,
  propeller,
  twister,
  yolk,
  etched,
  'split-splatter': withSplatter(split, 2),
  'yolk-splatter': withSplatter(yolk, 2),
  'marbled-splatter': withSplatter(marbled, 1),
}

// Approximated: glitter catching the light, a pearl's sheen, a glow's halo
const MATERIALS: Partial<Record<VinylMaterial, (next: Random) => string[]>> = {
  sparkle: (next) =>
    Array.from({ length: 24 }, () => {
      const { x, y } = onRecord(next)
      return dot('oklch(1 0 0 / 0.75)', x, y, 0.3 + next() * 0.4, 0.3)
    }),
  pearl: (next) => [
    `conic-gradient(from ${angle(next)}, oklch(0.9 0.06 350 / 0.22), oklch(0.9 0.06 220 / 0.22), oklch(0.92 0.06 140 / 0.22), oklch(0.9 0.06 350 / 0.22))`,
  ],
  glow: () => [
    'radial-gradient(circle closest-side, transparent 40%, oklch(0.95 0.14 140 / 0.35))',
  ],
}

export const discSurface = (
  { effect, colours, materials }: VinylColour,
  seed: number,
): DiscSurface => {
  const next = seededRandom(seed)
  const layers = [
    ...materials.flatMap((material) => MATERIALS[material]?.(next) ?? []),
    ...EFFECTS[effect](colours, next),
  ]
  return {
    background: layers.join(', '),
    seeThrough: colours.some((hue) => hue.translucent),
    picture: materials.includes('picture-disc'),
  }
}
