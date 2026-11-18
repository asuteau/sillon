// The storyboard's cast: made-up records only, each with a seed for its
// generated Cover. The landing's own records first, then extras to fill the
// wall. The Stack is three of the landing's records; the last scanned, Low
// Season (Tangerine), is the newest Cover and the hero record.
import {
  LANDING_RECORDS,
  landingPressing,
} from '#/features/landing/content/landing.content'

export interface CastRecord {
  artist: string
  title: string
  label: string
  catno: string
  format: string
  year: number
  added: string
  seed: number
}

const landing = (index: number): CastRecord => {
  const { artist, title, label, catno, format, year, added } =
    LANDING_RECORDS[index]
  return {
    artist,
    title,
    label,
    catno,
    format: format.replace('Vinyl · ', ''),
    year,
    added,
    seed: landingPressing(index).id,
  }
}

const extra = (
  seed: number,
  artist: string,
  title: string,
  label: string,
  catno: string,
  format: string,
  year: number,
  added: string,
): CastRecord => ({ artist, title, label, catno, format, year, added, seed })

// The collection on the wall, newest first
export const WALL_CAST: readonly CastRecord[] = [
  landing(0),
  landing(1),
  extra(
    204_001,
    'Halden Moss',
    'Field Recordings',
    'Kettle',
    'KT-004',
    'LP · Album',
    1979,
    '12 Jun 2026',
  ),
  landing(3),
  extra(
    204_002,
    'Ines Kovac',
    'Weather Report',
    'Brass Lamp',
    'BL 2210',
    'LP · Album',
    1988,
    '6 Jun 2026',
  ),
  landing(4),
  extra(
    204_003,
    'The Northern Lines',
    'Signal Hill',
    'Ferro',
    'FR-31',
    'LP · Album',
    1971,
    '29 May 2026',
  ),
  landing(6),
  extra(
    204_004,
    'Saoirse Bell',
    'Glasshouse',
    'Clement',
    'CL 008',
    'LP · Album',
    2015,
    '17 May 2026',
  ),
  landing(7),
  extra(
    204_005,
    'Mateo Arranz',
    'Siesta Tapes',
    'Sol Mayor',
    'SM-56',
    '2×LP · Comp',
    1966,
    '2 May 2026',
  ),
  extra(
    204_006,
    'Yuki Tanabe',
    'Evening Rain',
    'Ondo',
    'OND 014',
    'LP · Album',
    1982,
    '21 Apr 2026',
  ),
  extra(
    204_007,
    'Delphine Aubrac',
    'Rue des Fleurs',
    'Ruelle',
    'SR 012',
    'LP · Album',
    1969,
    '9 Apr 2026',
  ),
  extra(
    204_008,
    'Copperfield Five',
    'Long Division',
    'Northside',
    'NS 4402',
    'LP · Album',
    1959,
    '28 Mar 2026',
  ),
  extra(
    204_009,
    'Amara Lune',
    'Tide Tables',
    'Harbour Lights',
    'HL 2019',
    'LP · Album',
    1976,
    '14 Mar 2026',
  ),
  extra(
    204_010,
    'Gustav Lind',
    'Winter Rooms',
    'Polar Sound',
    'PS 1288',
    'LP · Album',
    1975,
    '1 Mar 2026',
  ),
  extra(
    204_011,
    'The Velvet Hours',
    'Afterglow',
    'Crossfade',
    'CF-210',
    '12" · Single',
    1984,
    '20 Feb 2026',
  ),
  extra(
    204_012,
    'Noor Haddad',
    'Desert Radio',
    'Offshore',
    'OFF003',
    'LP · Album',
    2017,
    '4 Feb 2026',
  ),
]

// The Stack, in scan order: first scanned at the bottom of the pile
export const STACK_CAST: readonly CastRecord[] = [
  landing(8),
  landing(5),
  landing(2),
]

// The hero record: the last scanned, its disc in Tangerine
export const HERO_INDEX = 2 as const
export const HERO_LANDING_INDEX = 2
export const HERO_TINT_HUE = 62
