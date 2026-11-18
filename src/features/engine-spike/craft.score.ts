// The craft spike's shot (#110) as a pure score: a world in sleeve units
// (1 = a 12" sleeve's width), a camera rig and the beats over 10s. The DOM
// bakes it into WAAPI keyframes for CSS 3D. Engine-agnostic: no DOM.

type Bezier = readonly [number, number, number, number]

export const CRAFT_MS = 10_000

export const CURVE = {
  platter: [0.65, 0, 0.15, 1],
  out: [0.16, 1, 0.3, 1],
  inOut: [0.45, 0, 0.1, 1],
  // A camera with weight: slow off the mark, long settle
  dolly: [0.55, 0, 0.12, 1],
  linear: [0, 0, 1, 1],
} as const satisfies Record<string, Bezier>

// Cubic-bezier easing, solved for x by Newton then bisection, as CSS does
export const bezier = ([x1, y1, x2, y2]: Bezier) => {
  const cx = 3 * x1
  const bx = 3 * (x2 - x1) - cx
  const ax = 1 - cx - bx
  const cy = 3 * y1
  const by = 3 * (y2 - y1) - cy
  const ay = 1 - cy - by
  const x = (t: number) => ((ax * t + bx) * t + cx) * t
  const dx = (t: number) => (3 * ax * t + 2 * bx) * t + cx
  const y = (t: number) => ((ay * t + by) * t + cy) * t
  return (p: number) => {
    if (p <= 0) return 0
    if (p >= 1) return 1
    let t = p
    for (let i = 0; i < 6; i++) {
      const d = dx(t)
      if (Math.abs(d) < 1e-6) break
      t -= (x(t) - p) / d
    }
    if (t < 0 || t > 1 || Math.abs(x(t) - p) > 1e-5) {
      let [lo, hi] = [0, 1]
      t = p
      for (let i = 0; i < 30; i++) {
        if (x(t) < p) lo = t
        else hi = t
        t = (lo + hi) / 2
      }
    }
    return y(t)
  }
}

// A track: keys at seconds, each segment eased into its key
type Key = readonly [at: number, value: number, ease?: Bezier]

const track = (keys: readonly Key[]) => {
  const eases = keys.map(([, , e]) => bezier(e ?? CURVE.inOut))
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

export type Framing = 'wide' | 'tall'

export interface Vec3 {
  x: number
  y: number
  z: number
}

// The set. Sleeves stand on the floor (y = -0.5), facing +z; yaw in degrees
export interface SetSleeve {
  key: 'hero' | 'left' | 'right' | 'near'
  // HERO_CAST slot: whose Cover it wears
  cast: number
  x: number
  z: number
  yaw: number
}

export const DISC = { diameter: 0.94, depth: 0.008 }
export const FLOOR_Y = -0.5

export const SET: readonly SetSleeve[] = [
  { key: 'hero', cast: 0, x: 0, z: 0, yaw: -8 },
  { key: 'left', cast: 1, x: -1.3, z: -1.25, yaw: 22 },
  { key: 'right', cast: 2, x: 1.4, z: -0.95, yaw: -22 },
  { key: 'near', cast: 3, x: -1.75, z: 0.9, yaw: 30 },
]

// The camera: a target, then an orbit around it (yaw: camera to the right
// of the target, pitch: above it), a dolly distance and a dutch roll
export interface Camera {
  target: Vec3
  distance: number
  yaw: number
  pitch: number
  roll: number
  // Vertical field of view, degrees
  fov: number
}

export interface ShotPose {
  camera: Camera
  // Hero sleeve slides left, the disc out right (along the sleeve); it comes
  // a hair forward once clear, and turns (degrees, about its own axis)
  sleeveX: number
  discX: number
  discZ: number
  spin: number
  // Where the lens focuses (a world point) and how shallow (0..1)
  focus: Vec3
  aperture: number
  light: KeyLight
  // Fade up from the page ground
  exposure: number
}

// The key light, around the set: azimuth from the front (degrees, + =
// right), elevation, and a 0..1 strength. A tall strip softbox centred there
export interface KeyLight {
  azimuth: number
  elevation: number
  strength: number
}

const RIG: Record<
  Framing,
  {
    fov: number
    distance: readonly Key[]
    targetX: readonly Key[]
    yaw: readonly Key[]
  }
> = {
  wide: {
    fov: 26,
    // Dolly in from wide, a touch past, then settle back: the weight
    distance: [
      [0, 6.4],
      [6.6, 2.85, CURVE.dolly],
      [8.2, 3.0, CURVE.out],
    ],
    targetX: [
      [0, -0.05],
      [2.0, -0.05],
      [5.8, 0.26, CURVE.platter],
    ],
    yaw: [
      [0, -34],
      [7.4, 16, CURVE.inOut],
    ],
  },
  // About 4:5: re-framed, not scaled. The camera ends on the disc, the
  // sleeve cropped by the frame's left edge
  tall: {
    fov: 34,
    distance: [
      [0, 6.2],
      [6.6, 2.55, CURVE.dolly],
      [8.2, 2.7, CURVE.out],
    ],
    targetX: [
      [0, -0.05],
      [2.0, -0.05],
      [5.8, 0.5, CURVE.platter],
    ],
    yaw: [
      [0, -30],
      [7.4, 12, CURVE.inOut],
    ],
  },
}

const pitch = track([
  [0, 17],
  [7.0, 5, CURVE.inOut],
])
const roll = track([
  [0, -2.2],
  [7.0, 0, CURVE.inOut],
])
const targetY = track([
  [0, 0.06],
  [7.0, 0.02, CURVE.inOut],
])
const sleeveX = track([
  [0, 0],
  [2.2, 0],
  [4.6, -0.16, CURVE.out],
])
const discSlide = track([
  [0, 0],
  [1.9, 0],
  [5.0, 0.76, CURVE.platter],
])
const discZ = track([[0, 0]])
// Rack focus: from the far sleeves to the hero (0 → 1), then to the disc (2)
const focusBlend = track([
  [0, 0],
  [0.5, 0],
  [2.1, 1, CURVE.inOut],
  [3.8, 1],
  [5.4, 2, CURVE.inOut],
])
const apertureTrack = track([
  [0, 1],
  [7, 0.75, CURVE.inOut],
])
// The key crosses the set: its sheen crosses the hero Cover around 6-7s
const lightAzimuth = track([
  [0, -70],
  [4.0, -58, CURVE.inOut],
  [9.4, 2, CURVE.inOut],
  [10, 4, CURVE.out],
])
const lightStrength = track([
  [0, 0.75],
  [4.4, 0.8],
  [6.6, 1, CURVE.inOut],
  [10, 0.9],
])
const exposure = track([
  [0, 0],
  [0.9, 1, CURVE.out],
])
// Handheld: on through the shot, opening up in the final hold
const shake = track([
  [0, 0.5],
  [6.0, 0.3],
  [7.8, 1, CURVE.inOut],
])

// One turn per 1.8s: 33⅓ rpm
export const SPIN_DEG_PER_S = 360 / 1.8

// Smooth deterministic wander: incommensurate sines
const wander = (s: number, seed: number) =>
  Math.sin(s * 0.61 + seed) * 0.6 +
  Math.sin(s * 1.37 + seed * 2.1) * 0.3 +
  Math.sin(s * 2.93 + seed * 3.7) * 0.1

const lerp = (a: number, b: number, t: number) => a + (b - a) * t

const mixVec = (a: Vec3, b: Vec3, t: number): Vec3 => ({
  x: lerp(a.x, b.x, t),
  y: lerp(a.y, b.y, t),
  z: lerp(a.z, b.z, t),
})

const FAR_FOCUS: Vec3 = { x: -0.2, y: 0, z: -1.45 }

const rigTracks = {
  wide: {
    distance: track(RIG.wide.distance),
    targetX: track(RIG.wide.targetX),
    yaw: track(RIG.wide.yaw),
  },
  tall: {
    distance: track(RIG.tall.distance),
    targetX: track(RIG.tall.targetX),
    yaw: track(RIG.tall.yaw),
  },
}

// Rotate a point about the vertical axis (world yaw, degrees)
export const yawed = ({ x, y, z }: Vec3, yaw: number): Vec3 => {
  const r = (yaw * Math.PI) / 180
  return {
    x: x * Math.cos(r) + z * Math.sin(r),
    y,
    z: -x * Math.sin(r) + z * Math.cos(r),
  }
}

export const HERO = SET[0]

// The hero sleeve and its disc move along the sleeve's own axes
export const heroToWorld = (local: Vec3): Vec3 => {
  const p = yawed(local, HERO.yaw)
  return { x: p.x + HERO.x, y: p.y, z: p.z + HERO.z }
}

// The pose at `ms` into the shot. Pure: same time, same frame.
export const sampleShot = (ms: number, framing: Framing): ShotPose => {
  const s = Math.min(Math.max(ms, 0), CRAFT_MS) / 1000
  const rig = rigTracks[framing]
  const hand = shake(s)
  const sx = sleeveX(s)
  const dx = sx + discSlide(s)
  const dz = discZ(s)
  const blend = focusBlend(s)
  const hero = heroToWorld({ x: sx, y: 0, z: 0.01 })
  const disc = heroToWorld({ x: dx, y: 0, z: dz })
  const focus =
    blend <= 1 ? mixVec(FAR_FOCUS, hero, blend) : mixVec(hero, disc, blend - 1)
  return {
    camera: {
      target: { x: rig.targetX(s), y: targetY(s), z: 0 },
      distance: rig.distance(s) + wander(s, 4.2) * 0.02 * hand,
      yaw: rig.yaw(s) + wander(s, 1.3) * 0.7 * hand,
      pitch: pitch(s) + wander(s, 2.7) * 0.45 * hand,
      roll: roll(s) + wander(s, 5.9) * 0.35 * hand,
      fov: RIG[framing].fov,
    },
    sleeveX: sx,
    discX: dx,
    discZ: dz,
    spin: s * SPIN_DEG_PER_S,
    focus,
    aperture: apertureTrack(s),
    light: {
      azimuth: lightAzimuth(s),
      elevation: 38,
      strength: lightStrength(s),
    },
    exposure: exposure(s),
  }
}

// Toward the key light
export const lightDirection = ({
  azimuth,
  elevation,
}: Pick<KeyLight, 'azimuth' | 'elevation'>): Vec3 => {
  const [a, e] = [(azimuth * Math.PI) / 180, (elevation * Math.PI) / 180]
  return {
    x: Math.cos(e) * Math.sin(a),
    y: Math.sin(e),
    z: Math.cos(e) * Math.cos(a),
  }
}

// The camera's world position for a pose
export const cameraPosition = ({
  target,
  distance,
  yaw,
  pitch: p,
}: Camera): Vec3 => {
  const [y, x] = [(yaw * Math.PI) / 180, (p * Math.PI) / 180]
  return {
    x: target.x + distance * Math.cos(x) * Math.sin(y),
    y: target.y + distance * Math.sin(x),
    z: target.z + distance * Math.cos(x) * Math.cos(y),
  }
}

// Distance from the camera along its view axis: what a lens focuses by
export const viewDepth = (camera: Camera, point: Vec3): number => {
  const eye = cameraPosition(camera)
  const fwd = {
    x: camera.target.x - eye.x,
    y: camera.target.y - eye.y,
    z: camera.target.z - eye.z,
  }
  const len = Math.hypot(fwd.x, fwd.y, fwd.z)
  return (
    ((point.x - eye.x) * fwd.x +
      (point.y - eye.y) * fwd.y +
      (point.z - eye.z) * fwd.z) /
    len
  )
}

// Circle of confusion, 0.. (thin lens, normalised): how blurred a point at
// `depth` is with the lens focused at `focusDepth`
export const confusion = (
  depth: number,
  focusDepth: number,
  aperture: number,
): number => Math.abs(1 / focusDepth - 1 / depth) * aperture

// The reduced-motion still: the disc out, turning stopped, light across it
export const STILL_MS = 8_400
