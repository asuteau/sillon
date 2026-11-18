// A CSS 3D film's optics, pure: the camera on its orbit, a thin lens's
// focus, the key light, and where a plane catches the light. In world units
// (a film picks its own, the hero's is a 12" sleeve's width), y up, +z
// toward the viewer. No DOM: a score turns these into looks.

export interface Vec3 {
  x: number
  y: number
  z: number
}

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

// The key light, round the set: azimuth from the front (degrees, + right),
// elevation, and a 0..1 strength. A tall strip softbox centred there
export interface KeyLight {
  azimuth: number
  elevation: number
  strength: number
}

// A placed object: translate, then rotateY (yaw), rotateX (pitch), rotateZ
// (roll), as CSS composes them
export interface Placement {
  x: number
  y: number
  z: number
  yaw: number
  pitch: number
  roll: number
}

const rad = (deg: number) => (deg * Math.PI) / 180

export const dot = (a: Vec3, b: Vec3) => a.x * b.x + a.y * b.y + a.z * b.z

export const sub = (a: Vec3, b: Vec3): Vec3 => ({
  x: a.x - b.x,
  y: a.y - b.y,
  z: a.z - b.z,
})

const scale = (a: Vec3, k: number): Vec3 => ({
  x: a.x * k,
  y: a.y * k,
  z: a.z * k,
})

export const normalise = (v: Vec3): Vec3 => {
  const l = Math.hypot(v.x, v.y, v.z) || 1
  return { x: v.x / l, y: v.y / l, z: v.z / l }
}

// Toward the key light
export const lightDirection = ({
  azimuth,
  elevation,
}: Pick<KeyLight, 'azimuth' | 'elevation'>): Vec3 => {
  const [a, e] = [rad(azimuth), rad(elevation)]
  return {
    x: Math.cos(e) * Math.sin(a),
    y: Math.sin(e),
    z: Math.cos(e) * Math.cos(a),
  }
}

// The camera's world position
export const cameraPosition = ({
  target,
  distance,
  yaw,
  pitch,
}: Camera): Vec3 => {
  const [y, x] = [rad(yaw), rad(pitch)]
  return {
    x: target.x + distance * Math.cos(x) * Math.sin(y),
    y: target.y + distance * Math.sin(x),
    z: target.z + distance * Math.cos(x) * Math.cos(y),
  }
}

// Distance from the camera along its view axis: what a lens focuses by
export const viewDepth = (camera: Camera, point: Vec3): number => {
  const eye = cameraPosition(camera)
  const forward = normalise(sub(camera.target, eye))
  return dot(sub(point, eye), forward)
}

// Circle of confusion (thin lens, normalised): how blurred a point at
// `depth` is with the lens focused at `focusDepth`
export const confusion = (
  depth: number,
  focusDepth: number,
  aperture: number,
): number => Math.abs(1 / focusDepth - 1 / depth) * aperture

// A direction in an object's frame, turned into the world's
export const orient = (v: Vec3, { yaw, pitch, roll }: Placement): Vec3 => {
  const [r, p, w] = [rad(roll), rad(pitch), rad(yaw)]
  // rotateZ, in world terms (y up)
  const a = {
    x: v.x * Math.cos(r) + v.y * Math.sin(r),
    y: -v.x * Math.sin(r) + v.y * Math.cos(r),
    z: v.z,
  }
  // rotateX
  const b = {
    x: a.x,
    y: a.y * Math.cos(p) + a.z * Math.sin(p),
    z: -a.y * Math.sin(p) + a.z * Math.cos(p),
  }
  // rotateY
  return {
    x: b.x * Math.cos(w) + b.z * Math.sin(w),
    y: b.y,
    z: -b.x * Math.sin(w) + b.z * Math.cos(w),
  }
}

export const toWorld = (local: Vec3, place: Placement): Vec3 => {
  const v = orient(local, place)
  return { x: v.x + place.x, y: v.y + place.y, z: v.z + place.z }
}

const yawed = ({ x, y, z }: Vec3, yaw: number): Vec3 => {
  const a = rad(yaw)
  return {
    x: x * Math.cos(a) + z * Math.sin(a),
    y,
    z: -x * Math.sin(a) + z * Math.cos(a),
  }
}

// Where the key light's mirror image sits on an upright plane, seen from
// the eye, in the plane's own (u right, v up) coordinates; null when the
// light is behind it
export const glint = (
  eye: Vec3,
  light: Vec3,
  centre: Vec3,
  yaw: number,
): { u: number; v: number; facing: number } | null => {
  const n = yawed({ x: 0, y: 0, z: 1 }, yaw)
  const facing = dot(n, light)
  if (facing <= 0.02) return null
  const r = sub(scale(n, 2 * facing), light)
  const t = dot(sub(eye, centre), n) / dot(r, n)
  const p = sub(sub(eye, scale(r, t)), centre)
  const xAxis = yawed({ x: 1, y: 0, z: 0 }, yaw)
  return { u: dot(p, xAxis), v: p.y, facing }
}
