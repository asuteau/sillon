// The hero film's storyboard (#114) as data: the beats, every timing, the
// set's layout and the camera's keys, per framing. Tune here; the pose
// (storyboard.pose.ts) only reads it. World in sleeve units (1 = a 12"
// sleeve's width), y up, the wall at z = 0 facing +z.
import { CURVE } from '#/features/engine-spike/craft.score'

type Bezier = readonly [number, number, number, number]
// A key: at seconds, a value, the easing into it (in-out by default)
export type Key = readonly [at: number, value: number, ease?: Bezier]

export type Framing = 'wide' | 'tall'

export const EASE = {
  ...CURVE,
  // A move that leaves fast and lands softly, for things thrown
  toss: [0.3, 0.1, 0.1, 1],
  // A press: down quickly
  press: [0.4, 0, 0.6, 1],
} as const satisfies Record<string, Bezier>

// The film proper; then the ambient hold, which never ends on the page.
// The storyboard plays HOLD_PREVIEW_MS of it before looping.
export const FILM_MS = 16_000
export const HOLD_PREVIEW_MS = 4_000
export const STORY_MS = FILM_MS + HOLD_PREVIEW_MS

export interface Beat {
  id: 'challenge' | 'cover' | 'stack' | 'hero' | 'pull'
  label: string
  from: number
  to: number
}

export const BEATS: readonly Beat[] = [
  { id: 'challenge', label: 'Challenge', from: 0, to: 2 },
  { id: 'cover', label: 'Cover first', from: 2, to: 5 },
  { id: 'stack', label: 'Scan a Stack', from: 5, to: 10.5 },
  { id: 'hero', label: 'Hero record', from: 10.5, to: 14 },
  { id: 'pull', label: 'Pull back', from: 14, to: 16 },
]

// Every cue, in seconds
export const T = {
  // Fade up from the page ground
  exposure: [0, 0.7],
  // Rows flip into Covers, top row first; each flip, and the delay between
  wave: { start: 2.05, stagger: 0.07, flip: 0.8 },
  // The cold grade lifts with the wave
  grade: [2.1, 3.6],
  // A light sweeps the wall once it is whole
  sweep: [3.35, 4.85],
  // Depth opens: the Covers lift off the wall, the lens opens
  depth: [3.4, 5.0],
  // The camera finds the three loose sleeves
  find: [4.75, 5.9],
  // Each sleeve: the scan line passes, the count ticks, it goes on the pile
  scans: [5.95, 6.95, 7.95],
  scanLine: 0.5,
  // After the line: the count ticks at +tick, the sleeve flies onto the pile
  tick: 0.4,
  pile: [0.45, 0.95],
  // The Stack's bar: up with the first scan, confirm pressed, gone
  hudIn: [5.75, 6.15],
  press: [8.85, 9.05, 9.25],
  hudOut: [9.3, 9.6],
  // The Stack lifts, turns over and flies into the collection, top first;
  // the wall makes room for it
  flight: { start: 9.25, stagger: 0.12, duration: 1.0 },
  reflow: [9.15, 10.05],
  // The newest Cover leaves the wall, then its disc slides out
  pullOut: [10.55, 11.85],
  discOut: [11.75, 13.15],
  // Then it comes round as the camera pulls back
  turn: [13.7, 16.3],
  // The wall falls off behind it, to this much dark
  dim: [10.6, 12.6],
  dimTo: 0.55,
} as const

// The set's layout. The wall: Covers on a grid, the collection; before the
// wave they are the Challenge's rows, a dense table on the same plane. The
// floor below and in front of it holds the three loose sleeves
export interface Layout {
  // The lens's optical centre across the frame (a shift lens): 16:9 keeps
  // the action right of centre, the headline's room on the left
  centre: number
  cols: number
  // Newest first, filling down the columns or across the rows: either way a
  // Stack of three arriving moves every Cover exactly one line on
  fill: 'down' | 'across'
  // Wall items (rows, then Covers)
  count: number
  pitch: number
  row: { height: number; width: number; x: number; y: number }
  floorY: number
  // The loose sleeves, back up, as dropped (x, z, turn in degrees)
  loose: ReadonlyArray<{ x: number; z: number; turn: number }>
  // Where the Stack piles up
  pile: { x: number; z: number }
  // Where the newest record is held up, out of the wall, to show its disc
  // yaw: turned to show its mouth as the disc leaves; turn: the yaw it
  // comes round to as the camera pulls back, showing its spine
  hero: {
    x: number
    y: number
    z: number
    yaw: number
    turn: number
    lean: number
  }
}

export const LAYOUT: Record<Framing, Layout> = {
  wide: {
    centre: 0.6,
    cols: 6,
    fill: 'down',
    count: 18,
    pitch: 1.14,
    row: { height: 0.235, width: 7.4, x: 2.05, y: 0 },
    floorY: -2.15,
    loose: [
      { x: -0.25, z: 1.5, turn: 13 },
      { x: 1.0, z: 1.3, turn: -8 },
      { x: 2.2, z: 1.55, turn: 18 },
    ],
    pile: { x: 1.0, z: 2.65 },
    hero: { x: -1.75, y: 0.45, z: 1.9, yaw: -26, turn: 30, lean: 4 },
  },
  tall: {
    centre: 0.5,
    cols: 3,
    fill: 'across',
    count: 15,
    pitch: 1.14,
    row: { height: 0.235, width: 7.4, x: 2.85, y: 0 },
    floorY: -3.3,
    loose: [
      { x: -0.5, z: 1.2, turn: 12 },
      { x: 0.6, z: 1.05, turn: -10 },
      { x: 0.05, z: 2.2, turn: 21 },
    ],
    pile: { x: 0.05, z: 3.25 },
    hero: { x: -0.3, y: 1.0, z: 1.9, yaw: -26, turn: 28, lean: 4 },
  },
}

// The camera: a target, an orbit about it (yaw: camera to the right of the
// target; pitch: above it), a dolly distance, a dutch roll; one lens per
// framing. Weight is written as keys: slow off the mark, a touch past,
// settling back
export interface Rig {
  fov: number
  targetX: readonly Key[]
  targetY: readonly Key[]
  targetZ: readonly Key[]
  distance: readonly Key[]
  yaw: readonly Key[]
  pitch: readonly Key[]
  roll: readonly Key[]
}

const { dolly, out, inOut, platter } = EASE

export const RIG: Record<Framing, Rig> = {
  wide: {
    fov: 30,
    targetX: [
      [0, 0.15],
      [2.2, 0.15],
      [4.8, -0.9, inOut],
      // Finds the loose sleeves, then tracks along them as each is scanned
      [5.9, 0.35, platter],
      [8.35, 1.95, inOut],
      // Settles on the Stack
      [8.95, 1.05, inOut],
      // Up with the Stack to the wall's corner, then onto the newest Cover
      [10.45, -2.3, platter],
      [12.4, -1.4, dolly],
      [13.2, -1.36, out],
      // Pull back: the record right of centre, the headline's room left
      [15.8, -1.5, platter],
    ],
    targetY: [
      [0, 0],
      [4.75, 0],
      [5.9, -2.15, platter],
      [8.95, -2.15],
      [10.45, 0.55, platter],
      [12.4, 0.45, dolly],
      [15.8, 0.42, platter],
    ],
    targetZ: [
      [0, 0],
      [4.75, 0],
      [5.9, 1.55, platter],
      [8.35, 1.7],
      [8.95, 2.45, inOut],
      [10.45, 0.3, platter],
      [12.4, 2.0, dolly],
      [15.8, 1.8, platter],
    ],
    distance: [
      [0, 8.9],
      [2.2, 8.5, inOut],
      [4.8, 8.7, inOut],
      [5.9, 3.7, platter],
      [8.35, 3.3],
      [8.95, 3.75, inOut],
      [10.45, 6.6, platter],
      // The push, a touch past and back: the weight
      [12.35, 2.75, dolly],
      [13.1, 2.92, out],
      [15.8, 3.75, platter],
      [16.2, 3.8, out],
    ],
    yaw: [
      [0, 0],
      [2.2, 0],
      [4.8, 14, inOut],
      [5.9, -4, platter],
      [8.35, 7],
      [8.95, 2],
      [10.45, 8, platter],
      [12.4, 18, dolly],
      [15.8, -21, platter],
    ],
    pitch: [
      [0, 0],
      [2.2, 0],
      [4.8, 5, inOut],
      [5.9, 54, platter],
      [8.35, 50],
      [8.95, 52],
      [10.45, 6, platter],
      [12.4, 7, dolly],
      [15.8, 6, platter],
    ],
    roll: [
      [0, 0],
      [3.0, 0],
      [4.8, 1, inOut],
      [5.9, 0, inOut],
      [10.45, 0],
      [12.4, -1.2, inOut],
      [15.6, -0.5, inOut],
    ],
  },
  // About 4:5, re-framed: the table cropped to its first columns, the wall
  // three Covers wide, the scan closer, the record held high in the frame
  tall: {
    fov: 38,
    targetX: [
      [0, 0.3],
      [2.2, 0.3],
      [4.8, 0, inOut],
      // One sleeve after the next, closer than 16:9
      [5.9, -0.45, platter],
      [6.55, -0.45],
      [7.0, 0.55, inOut],
      [7.55, 0.55],
      [8.0, 0.05, inOut],
      [8.95, 0.05],
      [10.45, -0.6, platter],
      [12.4, -0.05, dolly],
      [13.2, -0.02, out],
      [15.8, -0.32, platter],
    ],
    targetY: [
      [0, 0],
      [4.75, 0],
      [5.9, -3.3, platter],
      [8.95, -3.3],
      [10.45, 1.6, platter],
      [12.4, 1.0, dolly],
      [15.8, 0.95, platter],
    ],
    targetZ: [
      [0, 0],
      [4.75, 0],
      [5.9, 1.2, platter],
      [6.55, 1.2],
      [7.0, 1.05, inOut],
      [7.55, 1.05],
      [8.0, 2.2, inOut],
      [8.5, 2.2],
      [8.95, 3.0, inOut],
      [10.45, 0.3, platter],
      [12.4, 2.0, dolly],
      [15.8, 1.8, platter],
    ],
    distance: [
      [0, 5.2],
      [2.2, 5.0, inOut],
      [4.8, 7.0, inOut],
      [5.9, 3.2, platter],
      [8.5, 3.2],
      [8.95, 3.5, inOut],
      [10.45, 5.6, platter],
      [12.35, 2.9, dolly],
      [13.1, 3.05, out],
      [15.8, 3.6, platter],
      [16.2, 3.65, out],
    ],
    yaw: [
      [0, 0],
      [2.2, 0],
      [4.8, 12, inOut],
      [5.9, -4, platter],
      [8.95, 2],
      [10.45, 6, platter],
      [12.4, 18, dolly],
      [15.8, -20, platter],
    ],
    pitch: [
      [0, 0],
      [2.2, 0],
      [4.8, 5, inOut],
      [5.9, 55, platter],
      [8.95, 52],
      [10.45, 6, platter],
      [12.4, 7, dolly],
      [15.8, 6, platter],
    ],
    roll: [
      [0, 0],
      [3.0, 0],
      [4.8, 1, inOut],
      [5.9, 0, inOut],
      [10.45, 0],
      [12.4, -1.2, inOut],
      [15.8, -0.5, inOut],
    ],
  },
}

// The lens: where it focuses (a world point) and how shallow (0 = all sharp,
// the Challenge's cold flat look). Per framing, since the set differs
export const LENS = {
  aperture: [
    [0, 0],
    [3.2, 0],
    [5.0, 0.55, inOut],
    [8.95, 0.5],
    [10.35, 0.6, inOut],
    [13.2, 0.38, inOut],
    [16, 0.3],
  ],
} as const satisfies Record<string, readonly Key[]>

// What the lens is on: a rack from one subject to the next between keys
export type FocusSubject =
  'wall' | 'loose0' | 'loose1' | 'loose2' | 'pile' | 'hero' | 'disc'

export const FOCUS: ReadonlyArray<
  readonly [at: number, on: FocusSubject, ease?: Bezier]
> = [
  [0, 'wall'],
  [4.75, 'wall'],
  [5.9, 'loose0', platter],
  [6.55, 'loose0'],
  [6.95, 'loose1'],
  [7.55, 'loose1'],
  [7.95, 'loose2'],
  [8.5, 'loose2'],
  [8.95, 'pile'],
  [10.35, 'hero', platter],
  [12.1, 'hero'],
  [12.9, 'disc'],
  [14.2, 'disc'],
  [15.6, 'hero'],
]

// The key light: azimuth from the front (degrees, + right), elevation,
// strength. It crosses the wall in Cover first and the record in its beat
export const LIGHT = {
  azimuth: [
    [0, -20],
    [3.3, -55],
    [4.9, 40, inOut],
    [5.9, -30, inOut],
    [10.4, -40],
    [13.4, 30, inOut],
    [16.4, -34, inOut],
    [20, -40],
  ],
  elevation: [
    [0, 40],
    [16, 38],
  ],
  strength: [
    [0, 0.55],
    [2.2, 0.55],
    [3.6, 1, inOut],
    [10.4, 0.85],
    [12.4, 1, inOut],
    [16, 0.95],
  ],
} as const satisfies Record<string, readonly Key[]>

// Handheld: barely there through the film, opening up in the ambient hold
export const SHAKE: readonly Key[] = [
  [0, 0.15],
  [2.2, 0.15],
  [5, 0.45],
  [14, 0.35],
  [16, 1, inOut],
]
