// The landing's hero film as a score (film/film.model.ts), one per framing:
// Challenge → Cover first → Scan a Stack → Hero record → Pull back, then an
// ambient hold that loops for good. The world is posed in sleeve units
// (hero-pose.score.ts); here it becomes each tracked element's look, in
// stage units, for a CSS 3D set under one lens.
//
// Light and lens are baked into the looks: each face's shade and glint
// from the key, the Covers' sheen where the strip's reflection lands, and
// a thin lens's focus. Out of focus is a soft twin of a face (a static
// blur) faded in over it: a blur animated by the film would run on the
// main thread (it moves pixels, so the compositor can't), so the film only
// ever moves transforms and opacity. Only the large faces have a twin (a
// wall Cover, a sleeve's front and back): never an edge, a row or the disc.
import type { Look, Move, Score, Shot } from '../film/film.model'
import {
  cameraPosition,
  confusion,
  glint,
  lightDirection,
  normalise,
  orient,
  sub,
  viewDepth,
} from '../film/camera.utils'
import type { Placement, Vec3 } from '../film/camera.utils'
import { JACKET, faceLight, jacketFaces } from '../film/jacket.utils'
import type { JacketFaceKey } from '../film/jacket.utils'
import {
  BEATS,
  FILM_S,
  HOLD_FROM_S,
  HOLD_S,
  LAYOUT,
  RIG,
  T,
} from './hero-cues.score'
import type { HeroBeat, HeroFraming } from './hero-cues.score'
import { STACK_SIZE, discWorld, sampleStory } from './hero-pose.score'
import type { StoryPose } from './hero-pose.score'

export type { HeroBeat, HeroFraming } from './hero-cues.score'

export const HERO_FILM_MS = FILM_S * 1000
// Where the ambient hold's loop starts: the film has ended
export const HERO_HOLD_FROM_MS = HOLD_FROM_S * 1000

export const HERO_FACES = jacketFaces(JACKET)

// One turn per 1.8s: 33⅓ rpm
const SPIN_DEG_PER_S = 360 / 1.8

// The beat the film is in; the hold once it has ended
export const heroBeatAt = (ms: number): HeroBeat | 'hold' =>
  BEATS.find(({ to }) => ms < to * 1000)?.id ?? 'hold'

// The stage per framing, in stage units (1 = 1% of its width): its height,
// the lens (CSS perspective) for the rig's field of view, a sleeve's side,
// and the lens's optical centre across the frame
export interface HeroStage {
  aspect: number
  height: number
  perspective: number
  unit: number
  centre: number
}

const stageOf = (framing: HeroFraming, aspect: number): HeroStage => {
  const height = 100 / aspect
  const { fov } = RIG[framing]
  return {
    aspect,
    height,
    perspective: height / 2 / Math.tan((fov * Math.PI) / 360),
    // A bit larger than a sleeve ever gets on screen, so close-ups are
    // never upscaled
    unit: height * 0.72,
    centre: LAYOUT[framing].centre,
  }
}

export const HERO_STAGES: Record<HeroFraming, HeroStage> = {
  wide: stageOf('wide', 16 / 9),
  tall: stageOf('tall', 4 / 5),
}

// The barcode on a sleeve's back, sleeve units from its bottom right corner
export const BARCODE = { right: 0.08, bottom: 0.07, width: 0.3, height: 0.15 }

export const HERO_WALL_COUNT = Math.max(LAYOUT.wide.count, LAYOUT.tall.count)
const WALL = Array.from({ length: HERO_WALL_COUNT }, (_, i) => i)
const STACK = Array.from({ length: STACK_SIZE }, (_, k) => k)
const SHADED = [...HERO_FACES.map((f) => f.key), 'back'] as const
const GLINTING = HERO_FACES.map((f) => f.key).filter((k) => k !== 'front')

type WallTrack =
  `w${number}${'' | '-face' | '-soft' | '-edge' | '-shade' | '-gloss' | '-shadow'}`
type StackTrack =
  | `s${number}${'' | '-soft' | '-edge' | '-dim' | '-gloss' | '-landed' | '-line' | '-scan' | '-hit' | '-shadow' | '-wallshadow'}`
  | `s${number}-shade-${JacketFaceKey | 'back'}`
  | `s${number}-glint-${JacketFaceKey}`

export type HeroTrack =
  | 'world'
  | WallTrack
  | StackTrack
  | 'disc'
  | 'disc-sheen'
  | 'spin'
  | 'exposure'
  | 'grade'
  | 'hud'
  | `hud-n${1 | 2 | 3}`
  | 'hud-btn'
  | 'hud-hint'
  | 'hud-press'
  | 'added'

export const HERO_TRACKS: readonly HeroTrack[] = [
  'world',
  ...WALL.flatMap((i): WallTrack[] => [
    `w${i}`,
    `w${i}-face`,
    `w${i}-soft`,
    `w${i}-edge`,
    `w${i}-shade`,
    `w${i}-gloss`,
    `w${i}-shadow`,
  ]),
  ...STACK.flatMap((k): StackTrack[] => [
    `s${k}`,
    `s${k}-soft`,
    `s${k}-edge`,
    `s${k}-dim`,
    `s${k}-gloss`,
    `s${k}-landed`,
    `s${k}-line`,
    `s${k}-scan`,
    `s${k}-hit`,
    `s${k}-shadow`,
    `s${k}-wallshadow`,
    ...SHADED.map((f): StackTrack => `s${k}-shade-${f}`),
    ...GLINTING.map((f): StackTrack => `s${k}-glint-${f}`),
  ]),
  'disc',
  'disc-sheen',
  'spin',
  'exposure',
  'grade',
  'hud',
  'hud-n1',
  'hud-n2',
  'hud-n3',
  'hud-btn',
  'hud-hint',
  'hud-press',
  'added',
]

const clamp01 = (n: number) => Math.min(1, Math.max(0, n))
const clamp = (n: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, n))
// Focus in 0.02 steps, so a still subject holds one value
const quantise = (n: number) => Math.round(n * 50) / 50

const place = (p: Placement, unit: number): Move[] => [
  { translate: [p.x * unit, -p.y * unit, p.z * unit] },
  { rotateY: p.yaw },
  { rotateX: p.pitch },
  { rotateZ: p.roll },
]

// The camera as the world's inverse: dolly, roll, the orbit, the target
const cameraMoves = (
  { camera }: StoryPose,
  { perspective, unit }: HeroStage,
): Move[] => [
  { translate: [0, 0, perspective - camera.distance * unit] },
  { rotateZ: camera.roll },
  { rotateX: -camera.pitch },
  { rotateY: -camera.yaw },
  {
    translate: [
      -camera.target.x * unit,
      camera.target.y * unit,
      -camera.target.z * unit,
    ],
  },
]

// The heaviest blur on screen, stage units
const MAX_BLUR = 1.25

// How soft a face's twin is drawn, on screen at the depth faces are mostly
// seen from; the lens has it all in by half that blur, so a face is either
// near sharp or soft, rarely the mix of both in between
const SOFT_SCREEN = 0.9
const SOFT_RAMP = 0.45
const SOFT_DEPTH = 5
// The twin's own blur, stage units, as drawn at `unit`
export const softBlur = ({ unit, perspective }: HeroStage) =>
  (SOFT_SCREEN * SOFT_DEPTH * unit) / perspective

const shotAt = (
  ms: number,
  framing: HeroFraming,
  stage: HeroStage,
): Shot<HeroTrack> => {
  const { unit, height } = stage
  const pose = sampleStory(ms, framing)
  const { camera, light: key } = pose
  const eye = cameraPosition(camera)
  const light = lightDirection(key)
  const strip = lightDirection({ ...key, elevation: 0 })
  const shot: Shot<HeroTrack> = {}
  const set = (name: HeroTrack, look: Look) => {
    shot[name] = look
  }

  set('world', { transform: cameraMoves(pose, stage) })

  // The lens: how far out of focus a point is, 0 sharp to 1 the soft twin
  // alone
  const focusDepth = Math.max(0.3, viewDepth(camera, pose.focus))
  const softAt = (point: Vec3) => {
    const depth = Math.max(0.2, viewDepth(camera, point))
    const screen = Math.min(
      MAX_BLUR,
      confusion(depth, focusDepth, pose.aperture) * height * 0.24,
    )
    return quantise(clamp01(screen / SOFT_RAMP))
  }
  // The sharp face gives way as its twin comes in, so no crisp edge shows
  // round a soft Cover; a touch see-through mid-way, never more
  const sharpness = (soft: number) => Math.sqrt(1 - soft)

  // A shadow on the wall (z = 0) from something `z` in front of it
  const onWall = (x: number, y: number, z: number) => {
    const k = Math.max(0, z) / Math.max(0.25, light.z)
    return { x: x - light.x * k, y: y - light.y * k }
  }

  const { count } = LAYOUT[framing]
  WALL.forEach((i) => {
    // The 4:5 wall is smaller: the rest stay out of the shot
    const w = pose.wall[Math.min(i, count - 1)]
    const shown = i < count ? 1 : 0
    // The key falls off the wall once the hero record is out
    const lit = 1 - pose.dim
    const soft = softAt(w)
    set(`w${i}`, { transform: place(w, unit) })
    set(`w${i}-face`, { opacity: shown * lit * sharpness(soft) })
    set(`w${i}-soft`, { opacity: shown * lit * soft })
    // Edges have no twin: they fade as their Cover goes soft, so no sharp
    // line shows round it
    set(`w${i}-edge`, {
      opacity: shown * lit * clamp01(w.cover * 3) * clamp01(1 - soft * 2),
    })
    // Unlit until the sweep has passed it
    const swept = clamp01((pose.sweepX - w.x) / 1.2 + 0.5)
    set(`w${i}-shade`, { opacity: (1 - swept) * 0.5 })
    // The sweep: a band of light crossing the wall, on each Cover it
    // overlaps
    set(`w${i}-gloss`, {
      opacity: pose.sweep * w.cover,
      transform: [{ translate: [clamp(pose.sweepX - w.x, -2, 2) * unit, 0] }],
    })
    const sh = onWall(w.x, w.y, w.z + 0.05)
    set(`w${i}-shadow`, {
      opacity: shown * lit * w.cover * clamp01(0.35 + w.z * 3) * key.strength,
      transform: [
        { translate: [sh.x * unit, -sh.y * unit, 0.05] },
        { scale: 1 + w.z * 0.35 },
      ],
    })
  })

  STACK.forEach((k) => {
    const p = pose.stack[k]
    set(`s${k}`, { transform: place(p, unit) })
    const soft = softAt(p)
    // A sleeve is a solid: its faces stay opaque (the disc is inside), the
    // twin comes in over them
    set(`s${k}-soft`, { opacity: soft })
    set(`s${k}-edge`, { opacity: clamp01(1 - soft * 2) })
    const view = normalise(sub(eye, p))
    for (const face of HERO_FACES) {
      const lit = faceLight(
        face.normals.map((n) => orient(n, p)),
        key,
        view,
      )
      set(`s${k}-shade-${face.key}`, { opacity: lit.shade })
      if (face.key !== 'front')
        set(`s${k}-glint-${face.key}`, { opacity: lit.glint })
    }
    const back = faceLight([orient({ x: 0, y: 0, z: -1 }, p)], key, view)
    set(`s${k}-shade-back`, { opacity: back.shade })
    // The two not held up fall off with the wall
    set(`s${k}-dim`, { opacity: k < STACK_SIZE - 1 ? pose.dim : 0 })
    // The Cover's sheen where the strip's reflection lands, once upright
    const g =
      Math.abs(p.pitch) < 30
        ? glint(eye, strip, { x: p.x, y: p.y, z: p.z }, p.yaw)
        : null
    set(`s${k}-gloss`, {
      opacity: g
        ? key.strength *
          Math.min(1, g.facing * 1.4) *
          Math.exp(-(Math.max(0, Math.abs(g.u) - 0.5) ** 2) / 0.35)
        : 0,
      transform: [{ translate: [clamp(g?.u ?? 1.5, -1.5, 1.5) * unit, 0] }],
    })
    // Added: light crosses the Cover as it lands
    set(`s${k}-landed`, {
      opacity: Math.sin(Math.PI * p.landed),
      transform: [{ translate: [(p.landed * 2.2 - 1.1) * unit, 0] }],
    })
    // The scan: the line down the barcode, the hit's flash
    set(`s${k}-line`, {
      transform: [{ translate: [0, p.line * BARCODE.height * unit] }],
    })
    set(`s${k}-scan`, { opacity: p.scanning })
    set(`s${k}-hit`, { opacity: p.hit })
    // On the floor: a soft shadow away from the key, gone once airborne
    set(`s${k}-shadow`, {
      opacity: 1 - p.airborne,
      transform: [
        { translate: [(p.x - light.x * 0.06) * unit, p.z * unit, 0] },
        { rotateZ: -(p.roll - 180) },
      ],
    })
    // Upright before the wall: its shadow on the wall
    const upright = clamp01(1 - Math.abs(p.pitch) / 60) ** 2
    const ws = onWall(p.x, p.y, p.z + 0.04)
    set(`s${k}-wallshadow`, {
      opacity:
        ((upright * key.strength) / (1 + p.z * 0.9)) *
        (k < STACK_SIZE - 1 ? 1 - pose.dim : 1),
      transform: [
        { translate: [ws.x * unit, -ws.y * unit, 0.05] },
        { rotateZ: -p.yaw * 0.15 },
        { scaleX: 1 + p.z * 0.3 },
        { scaleY: 1 + p.z * 0.12 },
      ],
    })
  })

  // The disc: along its sleeve
  const disc = discWorld(pose)
  set('disc', { transform: [{ translate: [pose.disc * unit, 0, 0] }] })
  // The sheen is the light's, not the record's: it turns to face the key
  const hero = pose.stack[STACK_SIZE - 1]
  const dg = glint(eye, strip, disc, hero.yaw)
  const reach = dg ? Math.hypot(dg.u, dg.v) : 9
  set('disc-sheen', {
    opacity: dg
      ? key.strength * (0.35 + 0.65 * Math.exp(-((reach / 0.85) ** 2)))
      : 0.15,
    transform: [{ rotateZ: dg ? (Math.atan2(dg.u, dg.v) * 180) / Math.PI : 0 }],
  })
  set('spin', { transform: [{ rotateZ: (ms / 1000) * SPIN_DEG_PER_S }] })

  set('exposure', { opacity: 1 - pose.exposure })
  set('grade', { opacity: pose.grade })

  // The Stack's bar: the count rolling up, then the one confirm
  const { hud } = pose
  set('hud', {
    opacity: hud.on,
    transform: [{ translate: [0, (1 - hud.on) * 1.2] }],
  })
  for (const c of [1, 2, 3] as const) {
    const here = clamp01(hud.count - (c - 1))
    const gone = clamp01(hud.count - c)
    set(`hud-n${c}`, {
      opacity: here * (1 - gone),
      transform: [{ translate: [0, (1 - here) * 0.8 - gone * 0.8] }],
    })
  }
  set('hud-btn', {
    opacity: hud.button,
    transform: [
      { translate: [0, (1 - hud.button) * 0.7] },
      { scale: 1 - hud.press * 0.05 },
    ],
  })
  set('hud-hint', { opacity: 1 - Math.min(1, hud.button * 2) })
  set('hud-press', { opacity: hud.press })
  set('added', {
    opacity: pose.added,
    transform: [{ translate: [0, (1 - pose.added) * 1] }],
  })

  return shot
}

const scoreOf = (framing: HeroFraming): Score<HeroTrack> => {
  const stage = HERO_STAGES[framing]
  return {
    tracks: HERO_TRACKS,
    length: HERO_HOLD_FROM_MS + HOLD_S * 1000,
    // Never back to the Challenge: the hold loops on its own
    ending: { kind: 'loop', from: HERO_HOLD_FROM_MS },
    // Reduced motion: the hero record, its disc out in its Vinyl colour
    still: T.discOut[1] * 1000 + 450,
    cuts: [],
    sample: (ms) => shotAt(ms, framing, stage),
  }
}

export const HERO_SCORES: Record<HeroFraming, Score<HeroTrack>> = {
  wide: scoreOf('wide'),
  tall: scoreOf('tall'),
}
