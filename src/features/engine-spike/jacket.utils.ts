// The outer jacket as a solid: a printed front, a spine, top and bottom seams
// and the mouth the disc leaves through, the front's edges bevelled at 45°.
// In sleeve units (1 = a 12" sleeve's width), y up, the front facing +z.
// Pure: the DOM lays the faces out in CSS 3D and shades them from here.
import { lightDirection } from './craft.score'
import type { KeyLight, Vec3 } from './craft.score'

export interface JacketSize {
  // Thickness front to back, and how much of each front edge is bevelled
  depth: number
  bevel: number
  // The paper wall either side of the mouth's dark slot
  wall: number
}

// A jacket with a record in it, about 10mm: thicker than life (~3–4mm on
// 31cm), so the edges read at the shot's sizes and angles
export const JACKET: JacketSize = { depth: 0.032, bevel: 0.005, wall: 0.005 }

export type JacketFaceKey =
  | 'front'
  | 'spine'
  | 'top'
  | 'bottom'
  | 'mouth'
  | 'bevel-left'
  | 'bevel-right'
  | 'bevel-top'
  | 'bevel-bottom'

export interface JacketFace {
  key: JacketFaceKey
  // Outward, unit length, in the jacket's frame
  normal: Vec3
  // The normals the face spans: one for a flat face; for a bevel, the
  // ends of its rounded arc, the front's normal to its edge's
  normals: readonly Vec3[]
  centre: Vec3
  width: number
  height: number
  // Places a centred width × height element (px = units × `unit`)
  transform: (unit: number) => string
}

const px = (n: number) => `${Object.is(n, -0) ? 0 : n}px`

// A bevel's rounding starts 30° off the front: nearer it, the front's own
// sheen already reads, and the rim would glint every time the front does
const FILLET_START = Math.PI / 6

const filletStart = (front: Vec3, edge: Vec3): Vec3 => {
  const [c, s] = [Math.cos(FILLET_START), Math.sin(FILLET_START)]
  return {
    x: front.x * c + edge.x * s,
    y: front.y * c + edge.y * s,
    z: front.z * c + edge.z * s,
  }
}

export const jacketFaces = ({ depth, bevel }: JacketSize): JacketFace[] => {
  const h = 1 / 2
  const d = depth / 2
  const inner = 1 - 2 * bevel
  // Edge faces run from the back to where the bevel starts
  const edge = depth - bevel
  const edgeZ = -bevel / 2
  const slant = bevel * Math.SQRT2
  const s = Math.SQRT1_2
  const front: Vec3 = { x: 0, y: 0, z: 1 }
  const face = (
    key: JacketFaceKey,
    normal: Vec3,
    centre: Vec3,
    width: number,
    height: number,
    rotate: string,
    edgeNormal?: Vec3,
  ): JacketFace => ({
    key,
    normal,
    normals: edgeNormal
      ? [filletStart(front, edgeNormal), edgeNormal]
      : [normal],
    centre,
    width,
    height,
    transform: (unit) =>
      `translate3d(${px(centre.x * unit)}, ${px(-centre.y * unit)}, ${px(centre.z * unit)})${rotate ? ` ${rotate}` : ''}`,
  })
  // The bevels' centres: half a bevel in from the edge and the front
  const bh = h - bevel / 2
  const bz = d - bevel / 2
  return [
    face('front', { x: 0, y: 0, z: 1 }, { x: 0, y: 0, z: d }, inner, inner, ''),
    face(
      'spine',
      { x: -1, y: 0, z: 0 },
      { x: -h, y: 0, z: edgeZ },
      edge,
      inner,
      'rotateY(-90deg)',
    ),
    face(
      'mouth',
      { x: 1, y: 0, z: 0 },
      { x: h, y: 0, z: edgeZ },
      edge,
      inner,
      'rotateY(90deg)',
    ),
    face(
      'top',
      { x: 0, y: 1, z: 0 },
      { x: 0, y: h, z: edgeZ },
      inner,
      edge,
      'rotateX(90deg)',
    ),
    face(
      'bottom',
      { x: 0, y: -1, z: 0 },
      { x: 0, y: -h, z: edgeZ },
      inner,
      edge,
      'rotateX(-90deg)',
    ),
    face(
      'bevel-left',
      { x: -s, y: 0, z: s },
      { x: -bh, y: 0, z: bz },
      slant,
      inner,
      'rotateY(-45deg)',
      { x: -1, y: 0, z: 0 },
    ),
    face(
      'bevel-right',
      { x: s, y: 0, z: s },
      { x: bh, y: 0, z: bz },
      slant,
      inner,
      'rotateY(45deg)',
      { x: 1, y: 0, z: 0 },
    ),
    face(
      'bevel-top',
      { x: 0, y: s, z: s },
      { x: 0, y: bh, z: bz },
      inner,
      slant,
      'rotateX(45deg)',
      { x: 0, y: 1, z: 0 },
    ),
    face(
      'bevel-bottom',
      { x: 0, y: -s, z: s },
      { x: 0, y: -bh, z: bz },
      inner,
      slant,
      'rotateX(-45deg)',
      { x: 0, y: -1, z: 0 },
    ),
  ]
}

const dot = (a: Vec3, b: Vec3) => a.x * b.x + a.y * b.y + a.z * b.z

const normalise = (v: Vec3): Vec3 => {
  const l = Math.hypot(v.x, v.y, v.z) || 1
  return { x: v.x / l, y: v.y / l, z: v.z / l }
}

const r3 = (n: number) => Math.round(n * 1000) / 1000

// Satin paper: a broad highlight, not a mirror's pin
const SHININESS = 24

// The best alignment of `h` with any normal on the arc from a to b
const bestOnArc = (a: Vec3, b: Vec3, h: Vec3) => {
  const ab = dot(a, b)
  const e2 = normalise({
    x: b.x - ab * a.x,
    y: b.y - ab * a.y,
    z: b.z - ab * a.z,
  })
  const [u, v] = [dot(h, a), dot(h, e2)]
  const angle = Math.atan2(v, u)
  if (angle >= 0 && angle <= Math.acos(ab)) return Math.hypot(u, v)
  return Math.max(u, dot(h, b))
}

// The strip runs from the floor to a little above the key's centre: its
// reflection is wherever on it the eye sees one
const STRIP_STEP = 2

// Light on a face from the key seen along `view` (unit vector toward the
// camera): `shade`, an overlay of dark (0 = fully lit, ambient plus
// Lambert), and `glint`, the strip softbox's highlight where the camera sees
// its reflection (Blinn-Phong over the strip's height and a bevel's arc),
// which runs along the edges as the camera moves
export const faceLight = (
  normals: readonly Vec3[],
  key: KeyLight,
  view: Vec3,
): { shade: number; glint: number } => {
  const [a, b = a] = normals
  const mid = normalise({ x: a.x + b.x, y: a.y + b.y, z: a.z + b.z })
  const lambert = Math.max(0, dot(mid, lightDirection(key)))
  const shade = r3(0.34 * (1 - lambert * key.strength) ** 1.6)
  let best = 0
  for (let e = 0; e <= key.elevation + 20; e += STRIP_STEP) {
    const light = lightDirection({ azimuth: key.azimuth, elevation: e })
    if (Math.max(dot(a, light), dot(b, light)) <= 0) continue
    if (Math.max(dot(a, view), dot(b, view)) <= 0) continue
    const half = normalise({
      x: light.x + view.x,
      y: light.y + view.y,
      z: light.z + view.z,
    })
    best = Math.max(best, bestOnArc(a, b, half))
  }
  return { shade, glint: r3(key.strength * best ** SHININESS) }
}
