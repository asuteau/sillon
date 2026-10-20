import type { ReleaseFormat } from '#/features/collection/collection.schema'
import { formatOklch } from '#/shared/utils/colour'
import { TINT_LIGHTNESS, TINT_MAX_CHROMA } from '#/shared/utils/cover-tint'

// Made-up records for the landing page. Only House sleeves appear on public
// pages, so no third-party cover art and no real artist is implied.
export interface LandingRecord {
  artist: string
  title: string
  year: number
  format: string
  label: string
  catno: string
  added: string
}

export const LANDING_RECORDS = [
  {
    artist: 'Marisol Okafor',
    title: 'Tidal Hours',
    year: 1974,
    format: 'Vinyl · LP · Album',
    label: 'Harbour Lights',
    catno: 'HL 2041',
    added: '12 Sep 2026',
  },
  {
    artist: 'The Lanterne Quartet',
    title: 'Night Ferry',
    year: 1968,
    format: 'Vinyl · LP · Album · Mono',
    label: 'Quai Records',
    catno: 'QR-118',
    added: '3 Sep 2026',
  },
  {
    artist: 'Juno Varga',
    title: 'Low Season',
    year: 2019,
    format: 'Vinyl · LP · Album',
    label: 'Offshore',
    catno: 'OFF009',
    added: '28 Aug 2026',
  },
  {
    artist: 'Oskar Hale Trio',
    title: 'Blue Room Sessions',
    year: 1961,
    format: 'Vinyl · LP · Album',
    label: 'Northside',
    catno: 'NS 4417',
    added: '21 Aug 2026',
  },
  {
    artist: 'Palais Ensemble',
    title: 'Second Pressing',
    year: 1983,
    format: 'Vinyl · 12" · EP',
    label: 'Atelier',
    catno: 'AT 12-06',
    added: '9 Aug 2026',
  },
  {
    artist: 'Ada Brightwell',
    title: 'Slow Arcs',
    year: 2004,
    format: 'Vinyl · 2×LP · Album',
    label: 'Lowfield',
    catno: 'LF-77',
    added: '30 Jul 2026',
  },
  {
    artist: 'Nils Ostrander',
    title: 'Outer Edge',
    year: 1977,
    format: 'Vinyl · LP · Album',
    label: 'Polar Sound',
    catno: 'PS 1302',
    added: '14 Jul 2026',
  },
  {
    artist: 'Kemi & The Parallels',
    title: 'Platter Speed',
    year: 1972,
    format: 'Vinyl · 7" · Single',
    label: 'Crossfade',
    catno: 'CF-45-11',
    added: '2 Jul 2026',
  },
  {
    artist: 'Corinne Vasquez',
    title: 'Paper Moons',
    year: 1996,
    format: 'Vinyl · LP · Album',
    label: 'Studio Ruelle',
    catno: 'SR 031',
    added: '19 Jun 2026',
  },
] as const satisfies readonly LandingRecord[]

// House sleeves are black, white and grey, so they give no tint in the app.
// The hero shows the tint a coloured Cover would give, at a hue, within the
// same lightness and chroma limits.
export const heroTint = (hue: number): string =>
  formatOklch({ l: TINT_LIGHTNESS, c: TINT_MAX_CHROMA, h: hue })

// Picks records by position so each still stays stable and varied
export const landingRecords = (...indexes: number[]): LandingRecord[] =>
  indexes.map((i) => LANDING_RECORDS[i % LANDING_RECORDS.length])

export const catalogueLines = ({
  year,
  format,
  label,
  catno,
}: LandingRecord): string[] => [String(year), format, `${label} · ${catno}`]

// The liner notes' stack
export const LINER_NOTES_STACK = [
  {
    name: 'TanStack Start',
    description:
      'Over Remix and Next: the cleanest DX I found (Router + server functions)',
    href: 'https://tanstack.com/start',
  },
  {
    name: 'TanStack Query',
    description: 'Server state, caching, optimistic updates',
    href: 'https://tanstack.com/query',
  },
  {
    name: 'Tailwind CSS v4',
    description: 'Styling, CSS-first tokens',
    href: 'https://tailwindcss.com',
  },
  {
    name: 'shadcn/ui + Base UI',
    description: 'Behaviour and accessibility under the Sillon styling',
    href: 'https://ui.shadcn.com',
  },
  {
    name: 'vaul',
    description: 'Native-feeling bottom sheets',
    href: 'https://vaul.emilkowal.ski',
  },
  {
    name: 'Zod',
    description: 'Validation at API boundaries',
    href: 'https://zod.dev',
  },
  {
    name: 'PWA (vite-plugin-pwa)',
    description: 'Installable, offline fallback',
    href: 'https://vite-pwa-org.netlify.app',
  },
  {
    name: 'BarcodeDetector API',
    description:
      "Scans a sleeve's barcode; ZXing WebAssembly where the browser has none",
    href: 'https://developer.mozilla.org/en-US/docs/Web/API/BarcodeDetector',
  },
  {
    name: 'Discogs API',
    description: 'Collection, wantlist, estimated value. OAuth 1.0a',
    href: 'https://www.discogs.com/developers',
  },
  {
    name: 'Deezer API',
    description: "HD Covers, since Discogs' are too small",
    href: 'https://developers.deezer.com',
  },
] as const

// The Portrait still's figures, for the made-up collection above: one
// Leader among the Top artists and among the Pressing decades
export const LANDING_PORTRAIT = {
  currency: 'EUR',
  estimatedValue: { minimum: 1380, median: 2140, maximum: 3050 },
  topArtists: [
    { name: 'Marisol Okafor', copies: 9 },
    { name: 'The Lanterne Quartet', copies: 7 },
    { name: 'Juno Varga', copies: 6 },
    { name: 'Oskar Hale Trio', copies: 4 },
    { name: 'Palais Ensemble', copies: 3 },
  ],
  pressingDecades: [
    { decade: 1960, copies: 31 },
    { decade: 1970, copies: 46 },
    { decade: 1980, copies: 22 },
    { decade: 1990, copies: 9 },
    { decade: 2000, copies: 5 },
    { decade: 2010, copies: 18 },
    { decade: 2020, copies: 12 },
  ],
} as const

// Each record's formats as Discogs writes them, read for its Vinyl colour and
// Disc count like the app's. Indexed like LANDING_RECORDS; the id seeds the
// disc's splatter and marbling, so the stills never change
export interface LandingPressing {
  id: number
  formats: ReleaseFormat[]
}

export const LANDING_PRESSINGS: readonly LandingPressing[] = [
  {
    id: 104_101,
    formats: [{ name: 'Vinyl', qty: '1', descriptions: ['LP', 'Album'] }],
  },
  {
    id: 104_102,
    formats: [
      {
        name: 'Vinyl',
        qty: '1',
        descriptions: ['LP', 'Album', 'Mono'],
        text: 'Seafoam Translucent',
      },
    ],
  },
  {
    id: 104_103,
    formats: [
      {
        name: 'Vinyl',
        qty: '1',
        descriptions: ['LP', 'Album'],
        text: 'Tangerine',
      },
    ],
  },
  {
    id: 104_104,
    formats: [
      {
        name: 'Vinyl',
        qty: '1',
        descriptions: ['LP', 'Album'],
        text: 'Oxblood',
      },
    ],
  },
  {
    id: 104_105,
    formats: [
      {
        name: 'Vinyl',
        qty: '1',
        descriptions: ['12"', 'EP'],
        text: 'Clear With Black Splatter',
      },
    ],
  },
  {
    id: 104_106,
    formats: [
      {
        name: 'Vinyl',
        qty: '2',
        descriptions: ['LP', 'Album'],
        text: 'Disc 1: Seafoam, Disc 2: Oxblood',
      },
    ],
  },
  {
    id: 104_107,
    formats: [
      {
        name: 'Vinyl',
        qty: '1',
        descriptions: ['LP', 'Album'],
        text: 'Coke Bottle Clear',
      },
    ],
  },
  {
    id: 104_108,
    formats: [{ name: 'Vinyl', qty: '1', descriptions: ['7"', 'Single'] }],
  },
  {
    id: 104_109,
    formats: [
      {
        name: 'Vinyl',
        qty: '1',
        descriptions: ['LP', 'Album'],
        text: 'Bone Marbled',
      },
    ],
  },
]

export const landingPressing = (index: number): LandingPressing =>
  LANDING_PRESSINGS[index % LANDING_PRESSINGS.length]

// The hero film's cast, taking turns at the strip's centre, by LANDING_RECORDS
// index: each in a different Vinyl colour, the second with two discs. The
// hue is the tint its Cover would give (House sleeves give none)
export const HERO_CAST = [
  { index: 2, tintHue: 62 },
  { index: 5, tintHue: 190 },
  { index: 4, tintHue: 30 },
  { index: 6, tintHue: 150 },
] as const
