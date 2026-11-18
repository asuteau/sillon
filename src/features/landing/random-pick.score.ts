// The landing's Random pick loop as a score (film/film.model.ts): a crate of
// records under a camera, and two picks drawn from it.
//
// "Pick for me" is pressed; the front sleeves flick forward and one record
// rises out of the crate, turning to face the camera as the crate falls back
// into the haze; its disc slides out, turning, its heading rises. "Pick
// again": the record drops back, the dig goes deeper, the next one rises.
// Then the pick closes, everything settles back and the loop starts over.
import { CURVES, mix, round3, track } from './film/film.model'
import type { Key, Look, Move, Score, Shot } from './film/film.model'

export const RANDOM_PICK_MS = 11_200

// Geometry, stage units (the stage is 100 wide, 125 tall)
export const CRATE = {
  // A sleeve's side
  sleeve: 40,
  // Records in the crate, front to back
  slots: 7,
  // Sleeve to sleeve, front to back
  pitch: 4.2,
  // The crate's walls: height, and room round the records
  wall: 15,
  margin: 2.5,
} as const

// The Sleeve pull's pose: sleeve and disc part by a fifth of the sleeve each
// way
const PULL = CRATE.sleeve / 5
// Records lean back a touch at rest; flicked forward, they lean on the front
const LEAN = 5
const FLICK = -27
// A drawn record, out of the crate: raised clear of it, toward the camera
const PRESENTED = { x: -PULL, y: -46, z: 24 }
// The haze the crate falls back into while a record is out
const HAZE = 0.95

export const slotZ = (slot: number) => -slot * CRATE.pitch

// The two picks, by slot; each one's moments (ms)
export const PICKS = {
  a: {
    slot: 2,
    // Front sleeves flick forward, from here, one after the other
    dig: 700,
    lift: 1100,
    // Faces the camera
    out: 2500,
    discOut: 2600,
    // Pick again (a) or close (b): the disc tucks back, the record drops
    back: 4700,
    down: 5000,
    home: 5900,
  },
  b: {
    slot: 4,
    dig: 5950,
    lift: 6250,
    out: 7650,
    discOut: 7750,
    back: 9100,
    down: 9400,
    home: 10_300,
  },
} as const

export type PickName = keyof typeof PICKS

// Sleeves flicked forward for each pick: those in front of it not already
// down
const FLICKED: Record<PickName, readonly number[]> = { a: [0, 1], b: [2, 3] }
const FLICK_STAGGER = 120
const FLICK_MS = 460
// All of them settle back after the last pick, back to front
const SETTLE = 10_150
const SETTLE_STAGGER = 90
const SETTLE_MS = 520

export const SLOTS = Array.from({ length: CRATE.slots }, (_, i) => i)

export const RANDOM_PICK_TRACKS = [
  // The camera: the crate and everything in it
  'world',
  ...SLOTS.map((slot) => `sleeve:${slot}` as const),
  'disc:a',
  'disc:b',
  // The light crossing a drawn Cover as it turns to the camera
  'gloss:a',
  'gloss:b',
  // The crate's haze; each pick's own, while the other one is out
  'haze',
  'haze:a',
  'haze:b',
  // Discs turn, whichever pick they're in
  'spin',
  'caption:a',
  'caption:b',
  'pickFor',
  'pickAgain',
] as const

export type RandomPickTrack = (typeof RANDOM_PICK_TRACKS)[number]

const { platter, fade, out, inOut } = CURVES

// The camera, a crane over the crate: looking down at rest, level with a
// drawn record (a touch past, then settling), back up between picks.
// Comes round to where it started
const camera = {
  pitch: track([
    [0, 30],
    [950, 30, platter],
    [2350, 13, out],
    [2900, 14],
    [4900, 14, inOut],
    [5800, 25],
    [6400, 25, platter],
    [7500, 13, out],
    [8050, 14],
    [9300, 14, inOut],
    [11_000, 30],
  ]),
  yaw: track([
    [0, -14],
    [950, -14, inOut],
    [2900, -3, inOut],
    [4700, 0, inOut],
    [6000, 6, inOut],
    [8050, 2, inOut],
    [9300, 3, inOut],
    [11_000, -14],
  ]),
  // Dolly: toward the drawn record and up with it
  z: track([
    [0, 0],
    [950, 0, platter],
    [2350, 13, out],
    [2900, 12],
    [4900, 12, inOut],
    [5800, 4],
    [6400, 4, platter],
    [7500, 13, out],
    [8050, 12],
    [9300, 12, inOut],
    [11_000, 0],
  ]),
  y: track([
    [0, -2],
    [950, -2, platter],
    [2300, 24],
    [4900, 24, inOut],
    [5800, 2],
    [6400, 2, platter],
    [7450, 24],
    [9300, 24, inOut],
    [11_000, -2],
  ]),
}

// The world as the camera sees it, turned about the crate's centre
const worldMoves = (ms: number): Move[] => [
  { translate: [0, camera.y(ms), camera.z(ms)] },
  { rotateX: -camera.pitch(ms) },
  { rotateY: camera.yaw(ms) },
  { translate: [0, 0, ((CRATE.slots - 1) * CRATE.pitch) / 2] },
]

// A sleeve flicked forward at `at`, settling back at `settle`
const flickKeys = (at: number, settle: number): Key[] => [
  [0, 0],
  [at, 0, out],
  [at + FLICK_MS, FLICK],
  [settle, FLICK, inOut],
  [settle + SETTLE_MS, 0],
]

const flickOf = (slot: number) => {
  const pick = (['a', 'b'] as const).find((name) =>
    FLICKED[name].includes(slot),
  )
  if (!pick) return track([[0, 0]])
  const order = FLICKED[pick].indexOf(slot)
  // The last one flicked forward settles first
  const fromBack = Math.max(...FLICKED.b) - slot
  return track(
    flickKeys(
      PICKS[pick].dig + order * FLICK_STAGGER,
      SETTLE + fromBack * SETTLE_STAGGER,
    ),
  )
}

const FLICKS = SLOTS.map(flickOf)

// How far out of the crate a pick is: 0 in its slot, 1 facing the camera
const outOf = (name: PickName) => {
  const { lift, out: faced, back, down, home } = PICKS[name]
  // Rises with weight, a touch past, then settles
  const rise = track([
    [0, 0],
    [lift, 0, platter],
    [faced - 250, 1.05, inOut],
    [faced + 200, 1],
    [down, 1, inOut],
    [home, 0],
  ])
  const turn = track([
    [0, 0],
    [lift + 150, 0, platter],
    [faced, 1],
    [back + 200, 1, inOut],
    [home - 100, 0],
  ])
  return { rise, turn }
}

const OUT = { a: outOf('a'), b: outOf('b') }

const pickOf = (slot: number): PickName | undefined =>
  (['a', 'b'] as const).find((name) => PICKS[name].slot === slot)

const sleeveLook = (slot: number, ms: number): Look => {
  const flick = FLICKS[slot](ms)
  const pick = pickOf(slot)
  if (!pick) {
    return {
      transform: [
        { translate: [0, 0, slotZ(slot)] },
        { rotateX: LEAN + flick },
      ],
    }
  }
  const rise = OUT[pick].rise(ms)
  const turn = OUT[pick].turn(ms)
  // Faces the camera: the world's turn, undone
  return {
    transform: [
      {
        translate: [
          mix(0, PRESENTED.x, rise),
          mix(0, PRESENTED.y, rise),
          mix(slotZ(slot), PRESENTED.z, rise),
        ],
      },
      { rotateY: -camera.yaw(ms) * turn },
      { rotateX: mix(LEAN, camera.pitch(ms), turn) + flick },
    ],
  }
}

// The disc behind its Cover, sliding out to the Sleeve pull's pose
const discTrack = (name: PickName) => {
  const { discOut, back } = PICKS[name]
  return track([
    [0, 0],
    [discOut, 0, platter],
    [discOut + 800, 2 * PULL],
    [back, 2 * PULL, inOut],
    [back + 500, 0],
  ])
}

const DISC = { a: discTrack('a'), b: discTrack('b') }

// The light sweeps across the Cover as it comes round to face the camera
const glossOf = (name: PickName) => {
  const { lift, out: faced, home } = PICKS[name]
  const from = lift + 500
  return {
    // Back to its start unseen, once the record is home
    x: track([
      [0, -110],
      [from, -110, inOut],
      [faced + 300, 110],
      [home, 110],
      [home + 200, -110],
    ]),
    opacity: track([
      [0, 0],
      [from, 0],
      [from + 400, 0.9],
      [faced - 100, 0.9],
      [faced + 300, 0],
    ]),
  }
}

const GLOSS = { a: glossOf('a'), b: glossOf('b') }

const caption = (name: PickName) => {
  const { out: faced, back, home } = PICKS[name]
  return {
    opacity: track([
      [0, 0],
      [faced - 100, 0, out],
      [faced + 400, 1],
      [back, 1, fade],
      [back + 260, 0],
    ]),
    y: track([
      [0, 3],
      [faced - 100, 3, out],
      [faced + 400, 0],
      [home, 0],
      [home + 1, 3],
    ]),
  }
}

const CAPTION = { a: caption('a'), b: caption('b') }

// A button pressed: dips and comes back
const PRESS_MS = 260
const press = (at: number): Key[] => [
  [at, 1, fade],
  [at + PRESS_MS / 2, 0.94, out],
  [at + PRESS_MS, 1],
]

// "Pick for me" starts the first pick and comes back once the pick closes;
// "Pick again" draws the next
const BUTTONS = {
  pickFor: {
    opacity: track([
      [0, 1],
      [950, 1, fade],
      [1200, 0],
      [PICKS.b.home - 300, 0, out],
      [PICKS.b.home + 200, 1],
    ]),
    scale: track([[0, 1], ...press(500)]),
    y: track([
      [0, 0],
      [PICKS.b.home - 300, 2, out],
      [PICKS.b.home + 200, 0],
    ]),
  },
  pickAgain: {
    opacity: track([
      [0, 0],
      [PICKS.a.out, 0, out],
      [PICKS.a.out + 500, 1],
      [PICKS.b.back, 1, fade],
      [PICKS.b.back + 260, 0],
    ]),
    scale: track([[0, 1], ...press(PICKS.a.back - 200)]),
    y: track([
      [0, 2],
      [PICKS.a.out, 2, out],
      [PICKS.a.out + 500, 0],
      [PICKS.b.home, 0],
      [PICKS.b.home + 1, 2],
    ]),
  },
}

// Discs turn at about 33⅓ rpm, a whole number of turns a loop
const TURNS = 6

export const RANDOM_PICK_SCORE: Score<RandomPickTrack> = {
  tracks: RANDOM_PICK_TRACKS,
  length: RANDOM_PICK_MS,
  ending: { kind: 'loop', from: 0 },
  // Reduced motion: the first pick out, its disc pulled out, heading shown
  still: PICKS.a.back - 500,
  cuts: [],
  sample: (ms) => {
    const t = ms
    const shot: Shot<RandomPickTrack> = {
      world: { transform: worldMoves(t) },
      spin: {
        transform: [{ rotateZ: round3((t / RANDOM_PICK_MS) * TURNS * 360) }],
      },
    }
    for (const slot of SLOTS) shot[`sleeve:${slot}`] = sleeveLook(slot, t)
    for (const name of ['a', 'b'] as const) {
      const other = name === 'a' ? 'b' : 'a'
      shot[`disc:${name}`] = {
        transform: [{ translate: [DISC[name](t), 0, -0.4] }],
      }
      shot[`gloss:${name}`] = {
        opacity: GLOSS[name].opacity(t),
        transform: [{ translate: [GLOSS[name].x(t), 0] }],
      }
      shot[`haze:${name}`] = { opacity: OUT[other].turn(t) * HAZE }
      shot[`caption:${name}`] = {
        opacity: CAPTION[name].opacity(t),
        transform: [{ translate: [0, CAPTION[name].y(t)] }],
      }
    }
    shot.haze = { opacity: Math.max(OUT.a.turn(t), OUT.b.turn(t)) * HAZE }
    for (const name of ['pickFor', 'pickAgain'] as const) {
      const button = BUTTONS[name]
      shot[name] = {
        opacity: button.opacity(t),
        transform: [
          { translate: [0, button.y(t)] },
          { scale: button.scale(t) },
        ],
      }
    }
    return shot
  },
}
