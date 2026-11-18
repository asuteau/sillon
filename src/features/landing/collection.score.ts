// The Collection section's loop (#117) as a score (film/film.model.ts): the
// Sleeve pull on a strip seen through a camera, then a Cover growing into its
// Record screen, and back. One 10s pass, looped from 0.
//
// The pass: the centred disc is out; it tucks back in and the strip advances
// one slide while the camera swings with it; the next disc pulls out; the
// camera squares up to the strip and the Cover grows from its sleeve into the
// Record screen; a glint crosses the landed Cover; the strip turns over to the
// next record behind the screen; the Cover shrinks back onto the centred
// sleeve, its disc slides out again, and the camera swings back to where the
// pass began.
import { CURVES, mix, round3, sharpness, track } from './film/film.model'
import type { Beats, Key, Look, Score, Shot } from './film/film.model'

export const COLLECTION_LOOP_MS = 10_000
// The strip turns over to the next record here, behind the Record screen
const SWAP_MS = 7400
// A disc out of its sleeve turns once every 2s: five turns a pass
const SPIN_MS = 2000

// The strip's slots: 0 centred at the pass's start, 1 the next to come in
export const COLLECTION_SLOTS = [-1, 0, 1, 2] as const

export const COLLECTION_TRACKS = [
  // The camera: the strip and everything on it
  'camera',
  ...COLLECTION_SLOTS.map((slot) => `slide:${slot}` as const),
  // Each slide's sharp face, giving way to its soft twin off the centre
  ...COLLECTION_SLOTS.map((slot) => `slide:${slot}:sharp` as const),
  ...COLLECTION_SLOTS.map((slot) => `slide:${slot}:soft` as const),
  'sleeve:0',
  'disc:0',
  'sleeve:1',
  'disc:1',
  'caption:0',
  'caption:1',
  'screen',
  'screenHeading',
  'screenDiscs',
  // The Cover that grows from the strip into the Record screen
  'flyer',
  // Light crossing the landed Cover
  'glint',
  // Every disc's grooves turn together
  'spin',
] as const

export type CollectionTrack = (typeof COLLECTION_TRACKS)[number]

// What React renders: which records sit where
export interface CollectionScene {
  // Passes the strip has turned over: slot j shows cast member `pass + j`
  pass: number
  // The cast member on the Record screen and the flying Cover
  screen: number
}

// ---------------------------------------------------------------------------
// Geometry, stage units of the 4:5 stage (width 100)

const SLEEVE = 56
const SLIDE_Y = 50
// Slide to slide along the strip
const GAP = 64
// The Sleeve pull: sleeve and disc part by a fifth of the sleeve each way
const PULL = SLEEVE / 5
// The Record screen's Cover (size, centre)
const COVER = 52
const COVER_Y = 33
// A neighbour one slide off: smaller and dimmer as in the app, and set back
// out of focus, for depth
const NEIGHBOUR = { scale: 0.82, opacity: 0.5, z: -10 }
// A neighbour's soft twin's static blur
export const COLLECTION_SOFT_BLUR = 0.5
// The camera stepped back, while the Cover flies: the strip's scale
const STEP_BACK = 0.78

// The geometry as custom properties on the stage, for the CSS to place by
export const COLLECTION_STAGE_VARS = {
  '--loop-sleeve': `${SLEEVE}cqw`,
  '--loop-slide-y': `${SLIDE_Y}cqw`,
  '--loop-cover': `${COVER}cqw`,
  '--loop-cover-y': `${COVER_Y}cqw`,
} as const

// ---------------------------------------------------------------------------
// Keys. Two keys a millisecond apart are a cut, always out of sight

const { platter, fade, out, inOut, dolly } = CURVES

const KEYS = {
  // The camera's swing about the centred slide, and its tilt
  yaw: [
    [0, -10, inOut],
    [2300, -6, platter],
    [3600, -12, inOut],
    [4800, -10, platter],
    // Square to the lens for the Cover to leave, and to land
    [5500, 0],
    [9200, 0, dolly],
    [COLLECTION_LOOP_MS, -10],
  ],
  pitch: [
    [0, 7],
    [4800, 7, platter],
    [5500, 0],
    [9200, 0, dolly],
    [COLLECTION_LOOP_MS, 7],
  ],
  // Steps back as it squares up, so the Cover grows from a smaller sleeve;
  // in again once it has landed
  distance: [
    [0, 1],
    [4800, 1, platter],
    [5500, STEP_BACK],
    [9200, STEP_BACK, dolly],
    [COLLECTION_LOOP_MS, 1],
  ],
  // The strip's advance, in slides
  strip: [
    [0, 0],
    [2400, 0, platter],
    [3500, 1],
    [SWAP_MS - 1, 1],
    [SWAP_MS, 0],
  ],
  // How far each sleeve and disc is out, 0 tucked to 1 pulled
  'sleeve:0': [
    [0, 1],
    [1900, 1, platter],
    [2700, 0],
    [SWAP_MS - 1, 0],
    [SWAP_MS, 1],
  ],
  // Out again once the Cover has landed back on its sleeve
  'disc:0': [
    [0, 1],
    [1800, 1, inOut],
    [2600, 0],
    [9200, 0, platter],
    [COLLECTION_LOOP_MS, 1],
  ],
  'sleeve:1': [
    [0, 0],
    [3300, 0, platter],
    [4100, 1],
    [5800, 1, platter],
    [6500, 0],
  ],
  // Tucks back under the Cover as it flies
  'disc:1': [
    [0, 0],
    [3500, 0, platter],
    [4300, 1],
    [5600, 1, inOut],
    [6300, 0],
  ],
  'caption:0': [
    [0, 1],
    [1800, 1, fade],
    [2100, 0],
    [SWAP_MS - 1, 0],
    [SWAP_MS, 1],
  ],
  'caption:1': [
    [0, 0],
    [3800, 0, out],
    [4300, 1],
    [5400, 1, fade],
    [5700, 0],
  ],
  screen: [
    [0, 0],
    [5600, 0, fade],
    [6100, 1],
    [8400, 1, fade],
    [9000, 0],
  ],
  screenHeading: [
    [0, 0],
    [6300, 0, out],
    [6800, 1],
    [8400, 1, fade],
    [8700, 0],
  ],
  screenDiscs: [
    [0, 0],
    [6600, 0, out],
    [7100, 1],
    [8400, 1, fade],
    [8700, 0],
  ],
  // Shows over its sleeve, where the two line up; hides there again
  flyerShown: [
    [0, 0],
    [5599, 0],
    [5600, 1],
    [9200, 1],
    [9201, 0],
  ],
  // 0 over its sleeve in the strip, 1 the Record screen's Cover
  flyer: [
    [0, 0],
    [5600, 0, platter],
    [6500, 1],
    [8400, 1, platter],
    [9200, 0],
  ],
  // Across the Cover, left to right, then back out of sight
  glint: [
    [0, -80],
    [6500, -80, inOut],
    [7600, 80],
    [7601, -80],
  ],
} as const satisfies Record<string, readonly Key[]>

const TRACKS = new Map(
  Object.entries(KEYS).map(([name, keys]) => [name, track(keys)]),
)

// ---------------------------------------------------------------------------
// Looks

// A slide `distance` slides from the centre: the Sleeve pull's falloff
const slideLook = (distance: number): Look => {
  const t = Math.min(Math.abs(distance), 1)
  return {
    opacity: round3(mix(1, NEIGHBOUR.opacity, t)),
    transform: [
      {
        translate: [round3(distance * GAP), 0, round3(mix(0, NEIGHBOUR.z, t))],
      },
      { scale: round3(mix(1, NEIGHBOUR.scale, t)) },
    ],
  }
}

const shift = (x: number, y = 0): Look => ({
  transform: [{ translate: [round3(x), round3(y)] }],
})

const rise = (shown: number): Look => ({
  opacity: round3(shown),
  transform: [{ translate: [0, round3(mix(2, 0, shown))] }],
})

// The flying Cover over the centred sleeve, pulled, with the camera stepped
// back (it scales about the centred slide), from the Record screen's Cover
const FLYER_FROM = {
  x: -PULL * STEP_BACK,
  y: SLIDE_Y - COVER_Y,
  scale: (SLEEVE * STEP_BACK) / COVER,
}

const sample = (film: number): Shot<CollectionTrack> => {
  const ms = Math.min(Math.max(film, 0), COLLECTION_LOOP_MS)
  const at = (name: keyof typeof KEYS) => TRACKS.get(name)?.(ms) ?? 0
  const strip = at('strip')
  const flyer = at('flyer')
  const shot: Shot<CollectionTrack> = {
    camera: {
      transform: [
        { perspective: 1400 },
        { rotateX: round3(at('pitch')) },
        { rotateY: round3(at('yaw')) },
        { scale: round3(at('distance')) },
      ],
    },
    'sleeve:0': shift(-PULL * at('sleeve:0')),
    'disc:0': shift(PULL * at('disc:0')),
    'sleeve:1': shift(-PULL * at('sleeve:1')),
    'disc:1': shift(PULL * at('disc:1')),
    'caption:0': rise(at('caption:0')),
    'caption:1': rise(at('caption:1')),
    screen: { opacity: round3(at('screen')) },
    screenHeading: rise(at('screenHeading')),
    screenDiscs: rise(at('screenDiscs')),
    flyer: {
      opacity: at('flyerShown'),
      transform: [
        {
          translate: [
            round3(mix(FLYER_FROM.x, 0, flyer)),
            round3(mix(FLYER_FROM.y, 0, flyer)),
          ],
        },
        { scale: round3(mix(FLYER_FROM.scale, 1, flyer)) },
      ],
    },
    glint: shift(at('glint')),
    spin: { transform: [{ rotateZ: round3((ms / SPIN_MS) * 360) }] },
  }
  for (const slot of COLLECTION_SLOTS) {
    const soft = round3(Math.min(Math.abs(slot - strip), 1))
    shot[`slide:${slot}`] = slideLook(slot - strip)
    shot[`slide:${slot}:sharp`] = { opacity: round3(sharpness(soft)) }
    shot[`slide:${slot}:soft`] = { opacity: soft }
  }
  return shot
}

// Every instant a look jumps: both ends of each pair of keys a millisecond
// apart
const CUTS = [
  ...new Set(
    Object.values(KEYS).flatMap((keys) =>
      keys
        .slice(1)
        .flatMap(([next], i) =>
          next - keys[i][0] <= 1 ? [keys[i][0], next] : [],
        ),
    ),
  ),
].sort((a, b) => a - b)

export const COLLECTION_SCORE: Score<CollectionTrack> = {
  tracks: COLLECTION_TRACKS,
  length: COLLECTION_LOOP_MS,
  ending: { kind: 'loop', from: 0 },
  // Reduced motion: the Sleeve pull, the centred disc out, captioned
  still: 1000,
  cuts: CUTS,
  sample,
}

// ---------------------------------------------------------------------------
// Beats: the strip turns over behind the screen; the screen's record changes
// at the pass's start, while screen and Cover are hidden

export const collectionSceneAt = (elapsed: number): CollectionScene => ({
  pass: Math.floor(
    (elapsed + COLLECTION_LOOP_MS - SWAP_MS) / COLLECTION_LOOP_MS,
  ),
  screen: Math.floor(elapsed / COLLECTION_LOOP_MS) + 1,
})

const msUntilSceneChange = (elapsed: number): number => {
  const ms = elapsed % COLLECTION_LOOP_MS
  return ms < SWAP_MS ? SWAP_MS - ms : COLLECTION_LOOP_MS - ms
}

export const COLLECTION_BEATS: Beats<CollectionScene> = {
  at: collectionSceneAt,
  next: msUntilSceneChange,
}
