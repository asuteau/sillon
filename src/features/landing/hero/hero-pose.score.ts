// The hero film's cues sampled: the pose of every moving thing in the
// world at a time. Pure, no DOM: same time, same frame. The score
// (hero.score.ts) turns it into looks.
import { bezier } from '../film/film.model'
import type { Curve } from '../film/film.model'
import { toWorld } from '../film/camera.utils'
import type { Camera, KeyLight, Placement, Vec3 } from '../film/camera.utils'
import { JACKET } from '../film/jacket.utils'
import {
  EASE,
  FOCUS,
  HOLD_S,
  LAYOUT,
  LENS,
  LIGHT,
  RIG,
  SHAKE,
  T,
} from './hero-cues.score'
import type { HeroFraming, Key, Layout } from './hero-cues.score'

// A track: keys at seconds, each segment eased into its key
const track = (keys: readonly Key[]) => {
  const eases = keys.map(([, , e]) => bezier(e ?? EASE.inOut))
  return (s: number): number => {
    if (s <= keys[0][0]) return keys[0][1]
    for (let i = 1; i < keys.length; i++) {
      const [t1, v1] = keys[i]
      if (s <= t1) {
        const [t0, v0] = keys[i - 1]
        return v0 + (v1 - v0) * eases[i]((s - t0) / (t1 - t0))
      }
    }
    return keys[keys.length - 1][1]
  }
}

// 0 → 1 across [from, to], eased
const ramp = (from: number, to: number, ease: Curve = EASE.inOut) => {
  const e = bezier(ease)
  return (s: number) => e((s - from) / (to - from))
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const clamp01 = (n: number) => Math.min(1, Math.max(0, n))

const mixVec = (a: Vec3, b: Vec3, t: number): Vec3 => ({
  x: lerp(a.x, b.x, t),
  y: lerp(a.y, b.y, t),
  z: lerp(a.z, b.z, t),
})

export interface WallPose extends Placement {
  // 0 a row, 1 a Cover; its shadow on the wall follows
  cover: number
}

export interface StackPose extends Placement {
  // The scan line's travel over the barcode, 0..1, and its presence
  line: number
  scanning: number
  // The hit: a flash on the barcode, fading
  hit: number
  // Off the floor: the floor shadow fades
  airborne: number
  // Just landed in the collection: light crosses its Cover, 0..1 and back
  landed: number
}

export interface StoryPose {
  camera: Camera
  focus: Vec3
  aperture: number
  light: KeyLight
  exposure: number
  // The Challenge's cold grade, 1 → 0
  grade: number
  // The wall falls off once the hero record is out: the key is on it
  dim: number
  // The light sweep across the wall: world x of its centre, and strength
  sweepX: number
  sweep: number
  wall: WallPose[]
  stack: StackPose[]
  // The hero's disc, along its sleeve (sleeve widths)
  disc: number
  hud: {
    on: number
    // How many scanned, rolling: 0..3
    count: number
    press: number
    // The confirm button's presence
    button: number
  }
  // The app's line once the Stack is added
  added: number
}

const rigTracks = (framing: HeroFraming) => {
  const r = RIG[framing]
  return {
    targetX: track(r.targetX),
    targetY: track(r.targetY),
    targetZ: track(r.targetZ),
    distance: track(r.distance),
    yaw: track(r.yaw),
    pitch: track(r.pitch),
    roll: track(r.roll),
  }
}

const RIGS = { wide: rigTracks('wide'), tall: rigTracks('tall') }

const aperture = track(LENS.aperture)
const azimuth = track(LIGHT.azimuth)
const elevation = track(LIGHT.elevation)
const strength = track(LIGHT.strength)
const shake = track(SHAKE)
const exposure = ramp(T.exposure[0], T.exposure[1], EASE.out)
const grade = ramp(T.grade[0], T.grade[1])
const sweep = ramp(T.sweep[0], T.sweep[1], EASE.inOut)
const depth = ramp(T.depth[0], T.depth[1], EASE.out)
const reflow = (i: number) =>
  ramp(T.reflow[0] + i * 0.012, T.reflow[1] + i * 0.012, EASE.platter)
const dim = ramp(T.dim[0], T.dim[1])
const turn = ramp(T.turn[0], T.turn[1], EASE.inOut)
const pullOut = ramp(T.pullOut[0], T.pullOut[1], EASE.dolly)
const discOut = ramp(T.discOut[0], T.discOut[1], EASE.platter)
const hudIn = ramp(T.hudIn[0], T.hudIn[1], EASE.out)
const hudOut = ramp(T.hudOut[0], T.hudOut[1], EASE.inOut)
const [a0, a1, a2, a3] = T.added
const added = (s: number) =>
  bezier(EASE.out)(clamp01((s - a0) / (a1 - a0))) *
  (1 - bezier(EASE.inOut)(clamp01((s - a2) / (a3 - a2))))
const flipEase = bezier(EASE.inOut)
const travelEase = bezier(EASE.platter)
const tossEase = bezier(EASE.toss)
const outEase = bezier(EASE.out)

// Smooth deterministic wander: sines that all come round over the hold, so
// the ambient hold loops without a seam
const W = (2 * Math.PI) / HOLD_S
const wander = (s: number, seed: number) =>
  Math.sin(s * W + seed) * 0.6 +
  Math.sin(s * 2 * W + seed * 2.1) * 0.3 +
  Math.sin(s * 5 * W + seed * 3.7) * 0.1

// A stable 0..1 per item
const jitter = (i: number) => {
  const x = Math.sin(i * 12.9898 + 4.1) * 43758.5453
  return x - Math.floor(x)
}

// The wall's grid; past `count`, cells run on below (out of the frame)
export const cell = ({ cols, count, pitch, fill }: Layout, k: number) => {
  const rows = count / cols
  const [col, row] =
    fill === 'down'
      ? [Math.floor(k / rows), k % rows]
      : [k % cols, Math.floor(k / cols)]
  return {
    x: (col - (cols - 1) / 2) * pitch,
    y: ((rows - 1) / 2 - row) * pitch,
  }
}

export const rowSlot = ({ row, count }: Layout, i: number) => ({
  x: row.x,
  y: row.y + ((count - 1) / 2 - i) * row.height,
})

const JACKET_DEPTH = JACKET.depth

const lift = (i: number, s: number) => depth(s) * (0.04 + 0.11 * jitter(i))

export const STACK_SIZE = 3

const wallPose = (layout: Layout, i: number, s: number): WallPose => {
  const { start, stagger, flip } = T.wave
  const p = clamp01((s - (start + i * stagger)) / flip)
  const from = rowSlot(layout, i)
  // Making room for the Stack: one line on, straight
  const [a, b] = [cell(layout, i), cell(layout, i + STACK_SIZE)]
  const f = reflow(i)(s)
  const to = { x: lerp(a.x, b.x, f), y: lerp(a.y, b.y, f) }
  const t = travelEase(p)
  return {
    x: lerp(from.x, to.x, t),
    y: lerp(from.y, to.y, t),
    // A split-flap's arc toward the lens, then the lift as depth opens
    z: Math.sin(Math.PI * p) * 0.45 + lift(i, s),
    yaw: 0,
    pitch: -180 * flipEase(p),
    roll: 0,
    cover: outEase(clamp01((p - 0.5) * 2)),
  }
}

// A sleeve on the floor, back up, its top away from the lens
const onFloor = (
  layout: Layout,
  x: number,
  z: number,
  angle: number,
  h = 0,
) => ({
  x,
  y: layout.floorY + JACKET_DEPTH / 2 + h,
  z,
  yaw: 0,
  pitch: -90,
  roll: 180 + angle,
})

const stackPose = (layout: Layout, k: number, s: number): StackPose => {
  const loose = layout.loose[k]
  const scanAt = T.scans[k]
  const line = clamp01((s - scanAt) / T.scanLine)
  const scanning =
    clamp01((s - scanAt + 0.15) / 0.15) *
    clamp01((scanAt + T.scanLine + 0.25 - s) / 0.25)
  const hit =
    s < scanAt + T.scanLine ? 0 : Math.exp(-(s - scanAt - T.scanLine) * 5)
  // Onto the pile, a little off square, each on the last
  const toPile = clamp01((s - scanAt - T.pile[0]) / (T.pile[1] - T.pile[0]))
  const piled = onFloor(
    layout,
    layout.pile.x + (k - 1) * 0.035,
    layout.pile.z + (k - 1) * 0.025,
    [-4, 5, -2][k],
    k * JACKET_DEPTH * 1.02,
  )
  const dropped = onFloor(layout, loose.x, loose.z, loose.turn)
  const tp = tossEase(toPile)
  let pose: Placement = {
    x: lerp(dropped.x, piled.x, tp),
    y: lerp(dropped.y, piled.y, tp) + Math.sin(Math.PI * toPile) * 0.12,
    z: lerp(dropped.z, piled.z, tp),
    yaw: 0,
    pitch: -90,
    roll: lerp(dropped.roll, piled.roll, tp),
  }
  // The flight: top of the pile first, into the first cells of the wall.
  // It turns over early, then glides in face up, square, so the eye can
  // follow it home
  const order = STACK_SIZE - 1 - k
  const { start, stagger, duration, turnOver } = T.flight
  const fp = clamp01((s - (start + order * stagger)) / duration)
  const over = flipEase(clamp01(fp / turnOver))
  const slot = cell(layout, order)
  const inWall: Placement = {
    x: slot.x,
    y: slot.y,
    z: lift(-1 - order, s),
    yaw: 0,
    pitch: 0,
    roll: 360,
  }
  if (fp > 0) {
    const t = travelEase(fp)
    pose = {
      x: lerp(pose.x, inWall.x, t),
      y: lerp(pose.y, inWall.y, t),
      z: lerp(pose.z, inWall.z, t) + Math.sin(Math.PI * fp) * 0.25,
      yaw: 0,
      pitch: lerp(-90, 0, over),
      roll: lerp(pose.roll, 360, over),
    }
  }
  const landedAt = start + order * stagger + duration
  const landed = clamp01((s - landedAt + 0.08) / T.landed)
  // The newest Cover leaves the wall to be held up
  if (k === STACK_SIZE - 1) {
    const h = pullOut(s)
    if (h > 0) {
      const { hero } = layout
      pose = {
        x: lerp(pose.x, hero.x, h),
        y: lerp(pose.y, hero.y, h),
        z: lerp(pose.z, hero.z, h),
        yaw: lerp(pose.yaw, lerp(hero.yaw, hero.turn, turn(s)), h),
        pitch: lerp(pose.pitch, hero.lean, h),
        roll: pose.roll,
      }
    }
  }
  return {
    ...pose,
    line,
    scanning,
    hit,
    airborne: clamp01(fp * 4),
    landed: landed > 0 && landed < 1 ? landed : 0,
  }
}

export const discWorld = ({ disc, stack }: Pick<StoryPose, 'disc' | 'stack'>) =>
  toWorld({ x: disc, y: 0, z: 0 }, stack[STACK_SIZE - 1])

const focusOn = (
  on: (typeof FOCUS)[number][1],
  layout: Layout,
  stack: StackPose[],
  disc: Vec3,
): Vec3 => {
  const hero = stack[STACK_SIZE - 1]
  switch (on) {
    case 'wall':
      return { x: 0, y: 0, z: 0.1 }
    case 'loose0':
    case 'loose1':
    case 'loose2': {
      const l = layout.loose[Number(on.at(-1))]
      return { x: l.x, y: layout.floorY, z: l.z }
    }
    case 'pile':
      return { x: layout.pile.x, y: layout.floorY, z: layout.pile.z }
    case 'hero':
      return { x: hero.x, y: hero.y, z: hero.z }
    // The Cover, leaning toward its disc: both read, the Cover first
    case 'record':
      return mixVec({ x: hero.x, y: hero.y, z: hero.z }, disc, 0.35)
    case 'disc':
      return disc
  }
}

const focusEases = FOCUS.map(([, , e]) => bezier(e ?? EASE.inOut))

export const sampleStory = (ms: number, framing: HeroFraming): StoryPose => {
  const s = Math.max(ms, 0) / 1000
  const layout = LAYOUT[framing]
  const rig = RIGS[framing]
  const hand = shake(s)

  const wall = Array.from({ length: layout.count }, (_, i) =>
    wallPose(layout, i, s),
  )
  const stack = Array.from({ length: STACK_SIZE }, (_, k) =>
    stackPose(layout, k, s),
  )
  const disc = discOut(s) * 0.64
  const discPoint = discWorld({ disc, stack })

  let i = FOCUS.findIndex(([at]) => at > s)
  if (i === -1) i = FOCUS.length
  const [t0, a] = FOCUS[Math.max(0, i - 1)]
  const [t1, b] = FOCUS[Math.min(FOCUS.length - 1, i)]
  const f =
    i === 0 || i === FOCUS.length || t1 === t0
      ? 0
      : focusEases[i]((s - t0) / (t1 - t0))
  const focus = mixVec(
    focusOn(a, layout, stack, discPoint),
    focusOn(b, layout, stack, discPoint),
    f,
  )

  const scanned = T.scans.reduce(
    (n, at) => n + outEase(clamp01((s - at - T.tick) / 0.3)),
    0,
  )
  const [p0, p1, p2] = T.press

  return {
    camera: {
      target: { x: rig.targetX(s), y: rig.targetY(s), z: rig.targetZ(s) },
      distance: rig.distance(s) * (1 + wander(s, 4.2) * 0.006 * hand),
      yaw: rig.yaw(s) + wander(s, 1.3) * 0.8 * hand,
      pitch: rig.pitch(s) + wander(s, 2.7) * 0.5 * hand,
      roll: rig.roll(s) + wander(s, 5.9) * 0.35 * hand,
      fov: RIG[framing].fov,
    },
    focus,
    aperture: aperture(s),
    light: {
      azimuth: azimuth(s),
      elevation: elevation(s),
      strength: strength(s),
    },
    exposure: exposure(s),
    grade: 1 - grade(s),
    dim: dim(s) * T.dimTo,
    sweepX: lerp(-6.5, 6.5, sweep(s)),
    sweep: Math.sin(Math.PI * clamp01(sweep(s))),
    wall,
    stack,
    disc,
    hud: {
      on: hudIn(s) * (1 - hudOut(s)),
      count: scanned,
      press:
        s < p0
          ? 0
          : s < p1
            ? (s - p0) / (p1 - p0)
            : clamp01(1 - (s - p1) / (p2 - p1)),
      button: outEase(clamp01((s - T.scans[2] - T.tick - 0.2) / 0.35)),
    },
    added: added(s),
  }
}
