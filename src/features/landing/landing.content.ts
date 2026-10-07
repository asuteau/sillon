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

// Picks records by position so each still stays stable and varied
export const landingRecords = (...indexes: number[]): LandingRecord[] =>
  indexes.map((i) => LANDING_RECORDS[i % LANDING_RECORDS.length])

export const catalogueLines = ({
  year,
  format,
  label,
  catno,
}: LandingRecord): string[] => [String(year), format, `${label} · ${catno}`]

// The Colophon's stack notes
export const COLOPHON_STACK = [
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
    description: "Scans a sleeve's barcode, no dependency",
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
