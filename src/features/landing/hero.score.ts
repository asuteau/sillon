// The landing hero film, Pull, as a score (film/film.model.ts): timed cues
// per tracked element in two parts, played as one film.
//
// The opening plays once: the groove draws in, the wordmark shows, the groove
// becomes a disc, the House sleeve slides in, the disc tucks in and pulls out,
// the camera pulls back to the strip. Then the loop, one pass per record: the
// strip advances, the next disc pulls out, its Cover grows into the Record
// screen, back to the strip. The loop starts with the Record screen open, so
// the strip turns over (each slot to the next record) while it's hidden.
import { CURVES, bezier, mix } from './film/film.model'
import type { Beats, Look, Move, Score, Shot } from './film/film.model'

export const OPENING_MS = 6600
export const LOOP_MS = 7600
// Where the opening joins the loop: the strip, the centred disc pulled out
export const LOOP_ENTRY_MS = 1800
// The Record screen is hidden from here to the next record coming in
const SCREEN_SWAP_MS = 1700

export type HeroPart = 'opening' | 'loop'

// What React renders: which records sit where
export interface HeroScene {
  // Passes so far: the strip's slot 0 shows record `pass`, slot j `pass + j`
  pass: number
  // The record on the Record screen and the flying Cover
  screen: number
}

// Loop time since the loop's own 0, counting passes
const loopTime = (elapsed: number) => elapsed - OPENING_MS + LOOP_ENTRY_MS

export const heroSceneAt = (elapsed: number): HeroScene => {
  const time = loopTime(Math.max(elapsed, OPENING_MS))
  const pass = Math.floor(time / LOOP_MS)
  const ms = time % LOOP_MS
  // Until hidden, the screen keeps the record the last pass brought in
  return { pass, screen: ms < SCREEN_SWAP_MS ? pass : pass + 1 }
}

// Records that take turns across passes
export const HERO_CAST_SIZE = 4

// Which of the cast a strip slot shows in a pass (the Record screen: slot 0
// of its `screen` pass)
export const heroCast = (pass: number, slot: number): number =>
  (((pass + slot) % HERO_CAST_SIZE) + HERO_CAST_SIZE) % HERO_CAST_SIZE

// Time to the next change of scene; none during the opening
export const msUntilNextCue = (elapsed: number): number => {
  if (elapsed < OPENING_MS)
    return OPENING_MS - elapsed + msUntilNextCue(OPENING_MS)
  const ms = loopTime(elapsed) % LOOP_MS
  return ms < SCREEN_SWAP_MS ? SCREEN_SWAP_MS - ms : LOOP_MS - ms
}

export const HERO_BEATS: Beats<HeroScene> = {
  at: heroSceneAt,
  next: msUntilNextCue,
}

// ---------------------------------------------------------------------------
// Tracks: each animated element's keyframes, per part. Positions in cqw of the
// 4:5 stage (width 100), so the film scales with its column.

// Each cue's curve into the next
const EASE = {
  platter: bezier(CURVES.platter),
  fade: bezier(CURVES.fade),
  out: bezier(CURVES.out),
  inout: bezier(CURVES.inOut),
  linear: bezier(CURVES.linear),
}

export type Easing = keyof typeof EASE

// Translate (cqw), turn and scale; in this order
export interface Pose {
  x: number
  y: number
  s: number
  r: number
  // Turn about the vertical axis, for the sleeve sliding in
  ry: number
}

export interface Frame {
  at: number
  opacity: number
  pose: Pose
  // How much of the groove is drawn, 0 to 1
  draw: number
  // Into the next frame
  ease?: Easing
}

export type Track = readonly Frame[]

// The strip's slots: 0 centred, j a slide to the right
export const HERO_SLOTS = [-2, -1, 0, 1, 2, 3] as const
export type HeroSlot = (typeof HERO_SLOTS)[number]

export const HERO_TRACK_NAMES = [
  'groove',
  'grooveDraw',
  'wordmark',
  // The camera: the strip and everything on it
  'world',
  ...HERO_SLOTS.map((slot) => `slide:${slot}` as const),
  // Only the centred slide and the next have their disc out
  'sleeve:0',
  'disc:0',
  'sleeve:1',
  'disc:1',
  'caption:0',
  'caption:1',
  'pick',
  'screen',
  'screenHeading',
  'screenDiscs',
  // The Cover that grows from the strip into the Record screen
  'flyer',
] as const

export type HeroTrackName = (typeof HERO_TRACK_NAMES)[number]

const IDENTITY: Pose = { x: 0, y: 0, s: 1, r: 0, ry: 0 }

// A frame's look; anything left out is at rest
interface Cue extends Partial<Pose> {
  opacity?: number
  draw?: number
}

// The track's frame at `at` ms, eased into the next
const cue = (
  at: number,
  { opacity = 1, draw = 1, ...pose }: Cue = {},
  ease?: Easing,
): Frame => ({ at, opacity, pose: { ...IDENTITY, ...pose }, draw, ease })

const round2 = (n: number) => Math.round(n * 100) / 100

// Geometry (cqw)
const SLEEVE = 50
// The Sleeve pull: sleeve and disc part by a fifth of the sleeve each way
const PULL = SLEEVE / 5
// Slide to slide, along the strip
const GAP = 58
const NEIGHBOUR = { s: 0.82, opacity: 0.5 }
// The camera pulled back to the strip; scales about the centred slide
const CAMERA = { y: -8, s: 0.58 }
// The stage's layout, horizontally centred: the slide (size, centre), the
// groove there before it, and the Record screen's Cover (size, centre)
const HERO_GEOMETRY = {
  sleeve: SLEEVE,
  slideY: 56,
  groove: 44,
  cover: 46,
  coverY: 28,
} as const

// HERO_GEOMETRY as custom properties on the stage, for the CSS to place by
export const HERO_STAGE_VARS = {
  '--hero-sleeve': `${HERO_GEOMETRY.sleeve}cqw`,
  '--hero-slide-y': `${HERO_GEOMETRY.slideY}cqw`,
  '--hero-groove': `${HERO_GEOMETRY.groove}cqw`,
  '--hero-cover': `${HERO_GEOMETRY.cover}cqw`,
  '--hero-cover-y': `${HERO_GEOMETRY.coverY}cqw`,
} as const

// The flying Cover over the centred sleeve in the strip, pulled out
const FLYER_FROM: Cue = {
  x: round2(-PULL * CAMERA.s),
  y: round2(HERO_GEOMETRY.slideY + CAMERA.y - HERO_GEOMETRY.coverY),
  s: round2((SLEEVE * CAMERA.s) / HERO_GEOMETRY.cover),
}

// Where the sleeve slides in from: off left, turned
const SLEEVE_OFF: Cue = { x: -130, ry: 55, r: -8 }
const WORLD_STRIP: Cue = CAMERA
const RISE: Cue = { opacity: 0, y: 2 }

const neighbourAt = (slot: number): Cue => ({
  x: slot * GAP,
  s: NEIGHBOUR.s,
  opacity: NEIGHBOUR.opacity,
})

// Neighbours come in from beyond, together
const openingNeighbour = (slot: Exclude<HeroSlot, 0>): Track => {
  const start = 5300
  const from = { ...neighbourAt(slot), x: slot * GAP + Math.sign(slot) * 24 }
  return [
    cue(0, { ...from, opacity: 0 }),
    cue(start, { ...from, opacity: 0 }, 'out'),
    cue(start + 1000, neighbourAt(slot)),
  ]
}

const OPENING: Record<HeroTrackName, Track> = {
  grooveDraw: [
    cue(0, { draw: 0 }),
    cue(250, { draw: 0 }, 'platter'),
    cue(1350),
  ],
  groove: [
    cue(0, { r: -40, s: 0.94 }, 'out'),
    cue(1500),
    cue(1700, {}, 'fade'),
    cue(2150, { opacity: 0, s: 1.08 }),
  ],
  wordmark: [
    cue(0, RISE),
    cue(850, RISE, 'out'),
    cue(1450),
    cue(1750, {}, 'fade'),
    cue(2150, { opacity: 0 }),
  ],
  world: [cue(0), cue(5100, {}, 'platter'), cue(6400, WORLD_STRIP)],
  'slide:-2': openingNeighbour(-2),
  'slide:-1': openingNeighbour(-1),
  'slide:0': [cue(0)],
  'slide:1': openingNeighbour(1),
  'slide:2': openingNeighbour(2),
  'slide:3': openingNeighbour(3),
  // Slides in, the disc tucks inside, then the two part
  'sleeve:0': [
    cue(0, { ...SLEEVE_OFF, opacity: 0 }),
    cue(2900, { ...SLEEVE_OFF, opacity: 0 }),
    cue(2901, SLEEVE_OFF, 'out'),
    cue(3900, { x: -PULL }),
  ],
  // The groove turns into the disc
  'disc:0': [
    cue(0, { opacity: 0, s: 0.86 }),
    cue(1700, { opacity: 0, s: 0.86 }, 'out'),
    cue(2500),
    cue(3200, {}, 'inout'),
    cue(3900, { x: -PULL }),
    cue(4200, { x: -PULL }, 'platter'),
    cue(5000, { x: PULL }),
  ],
  'sleeve:1': [cue(0)],
  'disc:1': [cue(0)],
  'caption:0': [cue(0, RISE), cue(6000, RISE, 'out'), cue(6500)],
  'caption:1': [cue(0, RISE)],
  pick: [cue(0, RISE), cue(6000, RISE, 'out'), cue(6500)],
  screen: [cue(0, { opacity: 0 })],
  screenHeading: [cue(0, { opacity: 0, y: 3 })],
  screenDiscs: [cue(0, { opacity: 0, y: 3 })],
  flyer: [cue(0, { ...FLYER_FROM, opacity: 0 })],
}

const loopNeighbour = (slot: Exclude<HeroSlot, 0>): Track => [
  cue(0, neighbourAt(slot)),
  cue(2300, neighbourAt(slot), 'platter'),
  cue(3300, slot === 1 ? {} : neighbourAt(slot - 1)),
]

// From the Record screen open (the last pass's record) round to it again
const LOOP: Record<HeroTrackName, Track> = {
  grooveDraw: [cue(0)],
  groove: [cue(0, { opacity: 0, s: 1.08 })],
  wordmark: [cue(0, { opacity: 0 })],
  // Back to the strip as the screen fades; away as the next Cover grows
  world: [
    cue(0, { ...WORLD_STRIP, opacity: 0 }),
    cue(1000, { ...WORLD_STRIP, opacity: 0 }, 'fade'),
    cue(1600, WORLD_STRIP),
    cue(4500, WORLD_STRIP, 'fade'),
    cue(4800, { ...WORLD_STRIP, opacity: 0 }),
  ],
  'slide:-2': loopNeighbour(-2),
  'slide:-1': loopNeighbour(-1),
  // The strip advances: the centred slide steps left, the next one in
  'slide:0': [cue(0), cue(2300, {}, 'platter'), cue(3300, neighbourAt(-1))],
  'slide:1': loopNeighbour(1),
  'slide:2': loopNeighbour(2),
  'slide:3': loopNeighbour(3),
  // The centred record tucks back in as it leaves
  'sleeve:0': [
    cue(0, { x: -PULL }),
    cue(2100, { x: -PULL }, 'platter'),
    cue(2900),
  ],
  'disc:0': [cue(0, { x: PULL }), cue(2000, { x: PULL }, 'inout'), cue(2700)],
  // The next one pulls out as it arrives
  'sleeve:1': [cue(0), cue(2700, {}, 'platter'), cue(3500, { x: -PULL })],
  'disc:1': [cue(0), cue(3000, {}, 'platter'), cue(3900, { x: PULL })],
  'caption:0': [
    cue(0, RISE),
    cue(1300, RISE, 'out'),
    cue(1800),
    cue(2250, {}, 'fade'),
    cue(2510, { opacity: 0 }),
  ],
  'caption:1': [
    cue(0, RISE),
    cue(3200, RISE, 'out'),
    cue(3700),
    cue(4500, {}, 'fade'),
    cue(4760, { opacity: 0 }),
  ],
  pick: [
    cue(0, RISE),
    cue(1300, RISE, 'out'),
    cue(1800),
    cue(4500, {}, 'fade'),
    cue(4750, { opacity: 0 }),
  ],
  screen: [
    cue(0),
    cue(1000, {}, 'fade'),
    cue(1600, { opacity: 0 }),
    cue(4450, { opacity: 0 }, 'fade'),
    cue(4850),
  ],
  screenHeading: [
    cue(0),
    cue(1600),
    cue(1700, { opacity: 0, y: 3 }),
    cue(5100, { opacity: 0, y: 3 }, 'out'),
    cue(5700),
  ],
  screenDiscs: [
    cue(0),
    cue(1600),
    cue(1700, { opacity: 0, y: 3 }),
    cue(5550, { opacity: 0, y: 3 }, 'out'),
    cue(6150),
  ],
  // Shrinks back to the strip, hides over its sleeve; grows from the next
  flyer: [
    cue(0),
    cue(1000, {}, 'platter'),
    cue(1600, FLYER_FROM),
    cue(1601, { ...FLYER_FROM, opacity: 0 }),
    cue(4499, { ...FLYER_FROM, opacity: 0 }),
    cue(4500, FLYER_FROM, 'platter'),
    cue(5350),
  ],
}

export const HERO_TRACKS: Record<HeroPart, Record<HeroTrackName, Track>> = {
  opening: OPENING,
  loop: LOOP,
}

// The track's values at `ms`, each step on its curve
export const frameAt = (track: Track, ms: number): Frame => {
  const nextIndex = track.findIndex((frame) => frame.at > ms)
  if (nextIndex === -1) return track[track.length - 1]
  if (nextIndex === 0) return track[0]
  const from = track[nextIndex - 1]
  const to = track[nextIndex]
  const t = EASE[from.ease ?? 'linear']((ms - from.at) / (to.at - from.at))
  const step = (a: number, b: number) => round2(mix(a, b, t))
  return {
    at: ms,
    opacity: step(from.opacity, to.opacity),
    pose: {
      x: step(from.pose.x, to.pose.x),
      y: step(from.pose.y, to.pose.y),
      s: step(from.pose.s, to.pose.s),
      r: step(from.pose.r, to.pose.r),
      ry: step(from.pose.ry, to.pose.ry),
    },
    draw: step(from.draw, to.draw),
    ease: from.ease,
  }
}

// Translate, turn and scale, through a fixed 1000px lens
export const poseMoves = ({ x, y, s, r, ry }: Pose): Move[] => [
  { perspective: 1000 },
  { translate: [x, y] },
  { rotateY: ry },
  { rotateZ: r },
  { scale: s },
]

// A disc out of its sleeve turns, slow like a platter spinning down: four
// turns a pass, so the loop comes round on the same angle
const SPIN_MS = 1900

// Every disc's grooves turn together (`spin`), whichever slot they're in
export type HeroFilmTrack = HeroTrackName | 'spin'

const lookOf = (name: HeroTrackName, frame: Frame): Look =>
  name === 'grooveDraw'
    ? { draw: frame.draw }
    : { opacity: frame.opacity, transform: poseMoves(frame.pose) }

// Film time of a loop time: the loop joins at LOOP_ENTRY_MS and comes round
const fromLoop = (ms: number) =>
  OPENING_MS + ((ms - LOOP_ENTRY_MS + LOOP_MS) % LOOP_MS)

// The two parts as one film: the opening once, then the loop from where it
// joins, round and round
export const HERO_SCORE: Score<HeroFilmTrack> = {
  tracks: [...HERO_TRACK_NAMES, 'spin'],
  length: OPENING_MS + LOOP_MS,
  ending: { kind: 'loop', from: OPENING_MS },
  // Reduced motion: the opening's last frame, the strip in the Sleeve pull
  // pose: the centred disc pulled out, neighbours dimmed, caption shown
  still: OPENING_MS,
  cuts: [
    ...new Set([
      ...Object.values(OPENING).flatMap((track) =>
        track.map(({ at }) => at).filter((at) => at < OPENING_MS),
      ),
      ...Object.values(LOOP).flatMap((track) =>
        track.map(({ at }) => fromLoop(at)),
      ),
    ]),
  ].sort((a, b) => a - b),
  sample: (ms) => {
    const [part, at] =
      ms < OPENING_MS
        ? (['opening', ms] as const)
        : (['loop', loopTime(ms) % LOOP_MS] as const)
    const shot: Shot<HeroFilmTrack> = {
      spin: { transform: [{ rotateZ: round2((ms / SPIN_MS) * 360) }] },
    }
    for (const name of HERO_TRACK_NAMES)
      shot[name] = lookOf(name, frameAt(HERO_TRACKS[part][name], at))
    return shot
  },
}
