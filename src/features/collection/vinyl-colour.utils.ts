// Vinyl colour (CONTEXT.md): a best guess at a Release's disc colour and
// effect, read from Discogs' free-text format note. Pure, no request.
import type { CollectionRelease } from './collection.schema'

type Format = CollectionRelease['basic_information']['formats'][number]

// The Optimal Media effects, Discogs' vernacular folded into them
export type VinylEffect =
  | 'solid'
  | 'splatter'
  | 'marbled'
  | 'split'
  | 'corona'
  | 'ink-spot'
  | 'propeller'
  | 'twister'
  | 'yolk'
  | 'etched'
  | 'split-splatter'
  | 'yolk-splatter'
  | 'marbled-splatter'

export type ColourFamily =
  | 'black'
  | 'white'
  | 'grey'
  | 'silver'
  | 'gold'
  | 'red'
  | 'burgundy'
  | 'orange'
  | 'yellow'
  | 'green'
  | 'teal'
  | 'blue'
  | 'purple'
  | 'pink'
  | 'brown'
  | 'beige'
  | 'clear'

export interface VinylHue {
  family: ColourFamily
  render: string
  translucent: boolean
}

export type VinylMaterial = 'sparkle' | 'glow' | 'pearl' | 'picture-disc'

export interface VinylColour {
  effect: VinylEffect
  // The base first, then the colours the effect lays over it
  colours: VinylHue[]
  materials: VinylMaterial[]
}

interface NamedColour {
  family: ColourFamily
  render: string
  // Coke bottle, Curaçao, clear: see-through unless the note says opaque
  translucent?: boolean
}

// Plain family words: a named shade beside one ("Oxblood Red") wins
const FAMILY_COLOURS: Record<string, NamedColour> = {
  black: { family: 'black', render: '#0a0a0b' },
  white: { family: 'white', render: '#f2f0ea' },
  grey: { family: 'grey', render: '#8c8c8f' },
  gray: { family: 'grey', render: '#8c8c8f' },
  silver: { family: 'silver', render: '#c4c6ca' },
  gold: { family: 'gold', render: '#c9a24a' },
  red: { family: 'red', render: '#c8202a' },
  orange: { family: 'orange', render: '#ec7a1c' },
  yellow: { family: 'yellow', render: '#f2cc2e' },
  green: { family: 'green', render: '#2f9a4a' },
  teal: { family: 'teal', render: '#1f8a8a' },
  blue: { family: 'blue', render: '#2257c4' },
  purple: { family: 'purple', render: '#6c3aa8' },
  violet: { family: 'purple', render: '#7a4cc0' },
  pink: { family: 'pink', render: '#f08cb4' },
  brown: { family: 'brown', render: '#6e4428' },
  beige: { family: 'beige', render: '#d9c9a8' },
  clear: { family: 'clear', render: '#e9eef0', translucent: true },
}

const SHADES: Record<string, NamedColour> = {
  'jet black': { family: 'black', render: '#0a0a0b' },
  'ink black': { family: 'black', render: '#101018' },
  'milky white': { family: 'white', render: '#eeece6' },
  ivory: { family: 'beige', render: '#efe6cf' },
  cream: { family: 'beige', render: '#ede0bf' },
  bone: { family: 'beige', render: '#e3d8bf' },
  eggshell: { family: 'beige', render: '#ece4cf' },
  sand: { family: 'beige', render: '#d4bf94' },
  tan: { family: 'brown', render: '#b48a5e' },
  'crystal clear': { family: 'clear', render: '#eef3f5', translucent: true },
  'milky clear': { family: 'clear', render: '#e4e4e0', translucent: true },
  smoke: { family: 'grey', render: '#3c3c40', translucent: true },
  'smoke grey': { family: 'grey', render: '#4a4a4e', translucent: true },
  'smoke gray': { family: 'grey', render: '#4a4a4e', translucent: true },
  charcoal: { family: 'grey', render: '#36363a' },
  'metallic silver': { family: 'silver', render: '#c4c6ca' },
  'metallic gold': { family: 'gold', render: '#c9a24a' },
  copper: { family: 'orange', render: '#b8693a' },
  bronze: { family: 'brown', render: '#9a6a38' },
  oxblood: { family: 'burgundy', render: '#5e1018' },
  burgundy: { family: 'burgundy', render: '#6a1428' },
  maroon: { family: 'burgundy', render: '#6a1a22' },
  wine: { family: 'burgundy', render: '#6a1830' },
  'blood red': { family: 'red', render: '#8e0d12' },
  ruby: { family: 'red', render: '#a3112c' },
  cherry: { family: 'red', render: '#b3122a' },
  crimson: { family: 'red', render: '#b0102c' },
  scarlet: { family: 'red', render: '#d0201c' },
  tangerine: { family: 'orange', render: '#f2861e' },
  pumpkin: { family: 'orange', render: '#e06a1a' },
  mustard: { family: 'yellow', render: '#c9a020' },
  canary: { family: 'yellow', render: '#f6dc3a' },
  lemon: { family: 'yellow', render: '#f4e04a' },
  'coke bottle': { family: 'green', render: '#a9cbb4', translucent: true },
  'coke bottle green': {
    family: 'green',
    render: '#a9cbb4',
    translucent: true,
  },
  'coke bottle clear': {
    family: 'green',
    render: '#bcd8c4',
    translucent: true,
  },
  mint: { family: 'green', render: '#a8e0c4' },
  jade: { family: 'green', render: '#2f8f6a' },
  emerald: { family: 'green', render: '#13865a' },
  olive: { family: 'green', render: '#6b6e2a' },
  'forest green': { family: 'green', render: '#1f5a32' },
  lime: { family: 'green', render: '#9ccf2a' },
  seafoam: { family: 'teal', render: '#8fd0bc' },
  turquoise: { family: 'teal', render: '#2ab8b0' },
  aqua: { family: 'teal', render: '#4ac8d0' },
  cyan: { family: 'teal', render: '#22b0d6' },
  curacao: { family: 'blue', render: '#1aa0d8', translucent: true },
  'sky blue': { family: 'blue', render: '#86c4ec' },
  'baby blue': { family: 'blue', render: '#a8d0ee' },
  'royal blue': { family: 'blue', render: '#2446b0' },
  cobalt: { family: 'blue', render: '#1c3fa8' },
  navy: { family: 'blue', render: '#1a2450' },
  lilac: { family: 'purple', render: '#c0a6dc' },
  lavender: { family: 'purple', render: '#b4a2e0' },
  orchid: { family: 'purple', render: '#b468c4' },
  plum: { family: 'purple', render: '#5e2a5a' },
  grape: { family: 'purple', render: '#5a2a7a' },
  magenta: { family: 'pink', render: '#d0208a' },
  'hot pink': { family: 'pink', render: '#ea3a8e' },
  'baby pink': { family: 'pink', render: '#f6bcd2' },
  bubblegum: { family: 'pink', render: '#f48cba' },
  rose: { family: 'pink', render: '#e88aa0' },
  mahogany: { family: 'brown', render: '#5a2618' },
  'rose gold': { family: 'gold', render: '#d8a08a' },
  coffee: { family: 'brown', render: '#4a3020' },
}

// Neon names a colour's brightness the render colour already has
type Shift = 'dark' | 'light' | 'neon'

const SHIFTS: Record<string, Shift> = {
  dark: 'dark',
  deep: 'dark',
  light: 'light',
  pale: 'light',
  neon: 'neon',
}

const CLARITY: Record<string, boolean> = {
  translucent: true,
  transparent: true,
  trans: true,
  'see-through': true,
  opaque: false,
  solid: false,
}

type BaseEffect = Exclude<VinylEffect, 'solid' | `${string}-splatter`>

const EFFECTS: Record<string, BaseEffect> = {
  splatter: 'splatter',
  splattered: 'splatter',
  splatters: 'splatter',
  spatter: 'splatter',
  splash: 'splatter',
  marbled: 'marbled',
  marble: 'marbled',
  marbling: 'marbled',
  swirl: 'marbled',
  swirled: 'marbled',
  swirls: 'marbled',
  galaxy: 'marbled',
  split: 'split',
  'half and half': 'split',
  'side by side': 'split',
  corona: 'corona',
  'ink spot': 'ink-spot',
  inkspot: 'ink-spot',
  merge: 'ink-spot',
  propeller: 'propeller',
  'tri color': 'propeller',
  'tri colour': 'propeller',
  tricolor: 'propeller',
  tricolour: 'propeller',
  '3 way': 'propeller',
  '4 way': 'propeller',
  twister: 'twister',
  yolk: 'yolk',
  'egg yolk': 'yolk',
  'colour in colour': 'yolk',
  'color in color': 'yolk',
  etched: 'etched',
}

const MATERIALS: Record<string, VinylMaterial> = {
  glitter: 'sparkle',
  glittery: 'sparkle',
  sparkle: 'sparkle',
  sparkles: 'sparkle',
  sparkly: 'sparkle',
  'glow in the dark': 'glow',
  glow: 'glow',
  luminous: 'glow',
  pearl: 'pearl',
  pearlescent: 'pearl',
  'picture disc': 'picture-disc',
}

// The disc's colour when the note names only its material
const MATERIAL_COLOURS: Partial<Record<VinylMaterial, NamedColour>> = {
  glow: { family: 'green', render: '#d4efc0' },
  pearl: { family: 'white', render: '#efeae2' },
  sparkle: FAMILY_COLOURS.clear,
}

// Splatter over another effect, where Optimal Media presses the hybrid
const HYBRIDS: Partial<Record<BaseEffect, VinylEffect>> = {
  split: 'split-splatter',
  yolk: 'yolk-splatter',
  marbled: 'marbled-splatter',
}

// Words a colour stops being the disc's after: "Red Cover", "Grey Print"
const NOT_THE_DISC =
  /\b(cover|sleeve|jacket|label|print|printed|embossed|textured|insert|poster|booklet|obi|sticker|text|credits|barcode|pressing|press|mastering|etching|matrix|runout|edition)\b/
const THE_DISC = /\b(vinyl|disc|lp|wax)\b/
// "Disc 1: Red, Disc 2: Blue": the first disc stands for the Release
const SECOND_DISC = /\b(?:disc|lp|record|vinyl)\s*#?\s*(?:2|two|ii)\b/

type Token =
  | { kind: 'colour'; colour: NamedColour; plain: boolean }
  | { kind: 'shift'; shift: Shift }
  | { kind: 'clarity'; translucent: boolean }
  | { kind: 'effect'; effect: BaseEffect }
  | { kind: 'material'; material: VinylMaterial }
  // "in" puts the colour after it at the base: "Pink-In-Yellow"
  | { kind: 'sep'; base?: true }

const phrases = <T>(
  table: Record<string, T>,
  token: (value: T) => Token,
): [string, Token][] =>
  Object.entries(table).map(([word, value]) => [word, token(value)])

const PHRASES: [string, Token][] = [
  ...phrases(FAMILY_COLOURS, (colour) => ({
    kind: 'colour',
    colour,
    plain: true,
  })),
  ...phrases(SHADES, (colour) => ({ kind: 'colour', colour, plain: false })),
  ...phrases(SHIFTS, (shift) => ({ kind: 'shift', shift })),
  ...phrases(CLARITY, (translucent) => ({ kind: 'clarity', translucent })),
  ...phrases(EFFECTS, (effect) => ({ kind: 'effect', effect })),
  ...phrases(MATERIALS, (material) => ({ kind: 'material', material })),
  ['in', { kind: 'sep', base: true }],
  ...['/', '&', '+', 'and', 'w/', 'w.', 'with'].map((word): [string, Token] => [
    word,
    { kind: 'sep' },
  ]),
]

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')

const PHRASE_PATTERN = new RegExp(
  PHRASES.map(([phrase]) => phrase)
    .sort((a, b) => b.length - a.length)
    .map((phrase) => {
      const p = escape(phrase).replaceAll(' ', '[\\s-]+')
      return /\w$/.test(phrase) ? `(?<![\\w])${p}(?![\\w])` : p
    })
    .join('|'),
  'g',
)

const PHRASE_TOKENS = new Map(PHRASES)

const normalise = (text: string) =>
  text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

const tokenise = (text: string): Token[] =>
  [...text.matchAll(PHRASE_PATTERN)].map(
    ([match]) => PHRASE_TOKENS.get(match.replace(/[\s-]+/g, ' ')) as Token,
  )

const mix = (hex: string, toward: string, amount: number) => {
  const channel = (h: string, i: number) =>
    parseInt(h.slice(1 + i * 2, 3 + i * 2), 16)
  return `#${[0, 1, 2]
    .map((i) =>
      Math.round(
        channel(hex, i) + (channel(toward, i) - channel(hex, i)) * amount,
      )
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')}`
}

const shifted = (render: string, shift?: Shift) =>
  shift === 'dark'
    ? mix(render, '#000000', 0.35)
    : shift === 'light'
      ? mix(render, '#ffffff', 0.4)
      : render

const hueOf = (colour: NamedColour, shift?: Shift): VinylHue => ({
  family: colour.family,
  render: shifted(colour.render, shift),
  translucent: colour.translucent ?? false,
})

// One colour per group of words: "Blue Translucent", "Oxblood Red"
const toHue = (group: Token[], isBase: boolean): VinylHue | null => {
  // "With Gold Glitter": the gold is the glitter's, not the disc's
  if (!isBase && group.some((t) => t.kind === 'material')) return null
  const named = group.filter((t) => t.kind === 'colour')
  // "Clear Blue": clear beside a colour says the colour is see-through
  const colours = named.filter((t) => t.colour.family !== 'clear')
  const clarity =
    colours.length > 0 && colours.length < named.length
      ? { translucent: true }
      : group.find((t) => t.kind === 'clarity')
  // A bare "Transparent" is clear vinyl
  const colour =
    (colours.find((t) => !t.plain) ?? colours.at(0) ?? named.at(0))?.colour ??
    (clarity?.translucent ? FAMILY_COLOURS.clear : null)
  if (!colour) return null
  const hue = hueOf(colour, group.find((t) => t.kind === 'shift')?.shift)
  return { ...hue, translucent: clarity?.translucent ?? hue.translucent }
}

// Groups of words split at "/", "&", "with"…; the base group first
const groups = (tokens: Token[]): Token[][] => {
  const all: Token[][] = [[]]
  let base = -1
  for (const token of tokens) {
    if (token.kind !== 'sep') all[all.length - 1].push(token)
    else {
      if (token.base) base = all.length
      all.push([])
    }
  }
  if (base > 0 && base < all.length) all.unshift(...all.splice(base, 1))
  return all
}

const effectOf = (effects: BaseEffect[], colourCount: number): VinylEffect => {
  const other = effects.find((effect) => effect !== 'splatter')
  if (effects.includes('splatter'))
    return (other && HYBRIDS[other]) ?? other ?? 'splatter'
  return other ?? (colourCount > 1 ? 'split' : 'solid')
}

interface Reading {
  colours: VinylHue[]
  effects: BaseEffect[]
  materials: VinylMaterial[]
}

const read = (text: string): Reading => {
  const tokens = tokenise(text)
  return {
    colours: groups(tokens)
      .map((group, i) => toHue(group, i === 0))
      .filter((hue): hue is VinylHue => hue !== null),
    // "Black In Red" is a yolk unless the note names another effect
    effects: [
      ...tokens.flatMap((t) => (t.kind === 'effect' ? [t.effect] : [])),
      ...(tokens.some((t) => t.kind === 'sep' && t.base)
        ? (['yolk'] as const)
        : []),
    ],
    materials: [
      ...new Set(
        tokens.flatMap((t) => (t.kind === 'material' ? [t.material] : [])),
      ),
    ],
  }
}

// Parts of the main note about the disc itself, not its sleeve or plant
const discSegments = (main: string) =>
  main
    // A full stop ends a part, "w." and "Alt." don't
    .split(/[,;]|(?<=\w{4})\.\s/)
    .filter((segment) => !NOT_THE_DISC.test(segment) || THE_DISC.test(segment))

// The note's first part that names a colour, effect or material
const discSegment = (main: string): Reading | undefined =>
  discSegments(main)
    .map(read)
    .find(
      ({ colours, effects, materials }) =>
        colours.length > 0 || effects.length > 0 || materials.length > 0,
    )

// Bracketed names ("[Coke Bottle Clear]") are a fallback for the main note;
// quoted names ("The Black Dog") are left out
const noteParts = (note: string) => {
  const text = normalise(note).split(SECOND_DISC)[0]
  return {
    main: text
      .replace(/\[[^\]]*\]/g, ' ')
      .replace(/"[^"]*"|“[^”]*”/g, ' ')
      .replace(/[()]/g, ' '),
    bracketed: [...text.matchAll(/\[([^\]]*)\]/g)]
      .map(([, s]) => s)
      .join(' / '),
  }
}

// "Blue [Transparent Curacao]": a bracketed shade of the one colour named
const refined = (colours: VinylHue[], bracketed?: VinylHue): VinylHue[] =>
  colours.length === 1 && bracketed?.family === colours[0].family
    ? [
        {
          ...bracketed,
          translucent: colours[0].translucent || bracketed.translucent,
        },
      ]
    : colours

const parseNote = (note: string, descriptions: string[]): VinylColour => {
  const parts = noteParts(note)
  const bracketed = read(parts.bracketed)
  const segment = discSegment(parts.main)
  const colours = (
    segment?.colours.length
      ? refined(segment.colours, bracketed.colours[0])
      : bracketed.colours
  ).slice(0, 4)
  const effects = segment?.effects.length ? segment.effects : bracketed.effects
  const materials = [
    ...new Set([
      ...(segment?.materials.length ? segment.materials : bracketed.materials),
      ...(descriptions.includes('Picture Disc')
        ? (['picture-disc'] as const)
        : []),
    ]),
  ]
  // Black, vinyl's default, unless the material has a colour of its own
  const fallback =
    materials.map((material) => MATERIAL_COLOURS[material]).find(Boolean) ??
    FAMILY_COLOURS.black
  return {
    effect: effectOf(effects, colours.length),
    colours: colours.length > 0 ? colours : [hueOf(fallback)],
    materials,
  }
}

export const vinylColour = (formats: Format[]): VinylColour => {
  const disc = formats.find((format) => format.name === 'Vinyl')
  return parseNote(disc?.text ?? '', disc?.descriptions ?? [])
}

// Disc count (CONTEXT.md): a vinyl format's quantity, one when unknown
const discCount = (format: Format) =>
  Math.max(1, Number.parseInt(format.qty ?? '', 10) || 1)

// "Disc 1:", "LP2 -", "Record #3": where the note turns to one disc
const DISC_MARKER =
  /\b(?:disc|lp|record|vinyl)\s*#?\s*(\d+|one|two|three|four|i{1,3}|iv)\b\s*[:–-]?/g
const DISC_NUMBERS: Record<string, number> = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  i: 1,
  ii: 2,
  iii: 3,
  iv: 4,
}

// The note's part about each disc it singles out, by disc number
const discNotes = (note: string): Map<number, string> => {
  const text = normalise(note)
  const markers = [...text.matchAll(DISC_MARKER)]
  return new Map(
    markers.map((marker, i) => [
      DISC_NUMBERS[marker[1]] ?? Number(marker[1]),
      text.slice(marker.index + marker[0].length, markers.at(i + 1)?.index),
    ]),
  )
}

// The note says something about the disc: a colour, effect or material
const namesTheDisc = (note: string) => {
  const { main, bracketed } = noteParts(note)
  const { colours, effects, materials } = read(bracketed)
  return (
    discSegment(main) !== undefined ||
    colours.length + effects.length + materials.length > 0
  )
}

// One Vinyl colour per disc, in disc order, across every vinyl format. A
// disc the note doesn't single out takes the format's colour (vinylColour's)
export const vinylColours = (formats: Format[]): VinylColour[] =>
  formats
    .filter((format) => format.name === 'Vinyl')
    .flatMap((format) => {
      const descriptions = format.descriptions ?? []
      const overall = parseNote(format.text ?? '', descriptions)
      const own = discNotes(format.text ?? '')
      return Array.from({ length: discCount(format) }, (_, i) => {
        const note = own.get(i + 1)
        return note !== undefined && namesTheDisc(note)
          ? parseNote(note, descriptions)
          : overall
      })
    })

// Words that never name a disc's colour, left out of the audit
const NEVER_A_COLOUR = new Set(
  (
    'a an the of on to by for x side sides disc discs lp lps vinyl vinyls ' +
    'record records gram grams gr g heavyweight heavy weight gatefold ' +
    'limited ltd numbered edition colour color coloured colored variant ' +
    'version exclusive only copies alt alternate reissue remastered stereo ' +
    'mono rpm signed first st nd rd th'
  ).split(' '),
)

// For the Vinyl colour audit: the note's words the parser does not know
export const unrecognisedWords = (note: string): string[] => {
  const { main, bracketed } = noteParts(note)
  const words = [...discSegments(main), bracketed]
    .join(' ')
    .replace(PHRASE_PATTERN, ' ')
    .match(/[a-z]+/g)
  return [...new Set(words)].filter(
    (word) => word.length > 1 && !NEVER_A_COLOUR.has(word),
  )
}
