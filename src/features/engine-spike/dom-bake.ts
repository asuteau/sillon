// The score baked for CSS 3D: sample it 30 times a second and write each
// moving part's keyframes (transform, filter, opacity). Motion then plays
// them as WAAPI animations, linear between samples, so the curves are the
// score's own and the browser runs them off the main thread where it can.
import {
  CRAFT_MS,
  DISC,
  HERO,
  SET,
  cameraPosition,
  confusion,
  heroToWorld,
  lightDirection,
  sampleShot,
  viewDepth,
  yawed,
} from './craft.score'
import type { Framing, Vec3 } from './craft.score'
import { JACKET, faceLight, jacketFaces } from './jacket.utils'

export const BAKE_FPS = 30

const dot = (a: Vec3, b: Vec3) => a.x * b.x + a.y * b.y + a.z * b.z
const sub = (a: Vec3, b: Vec3): Vec3 => ({
  x: a.x - b.x,
  y: a.y - b.y,
  z: a.z - b.z,
})
const scale = (a: Vec3, k: number): Vec3 => ({
  x: a.x * k,
  y: a.y * k,
  z: a.z * k,
})
const r3 = (n: number) => Math.round(n * 1000) / 1000
const r1 = (n: number) => Math.round(n * 10) / 10

// Where the key light's mirror image sits on a plane, seen from the eye, in
// the plane's own (u right, v up) coordinates; null when the light is behind
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

export interface Stage {
  width: number
  height: number
  framing: Framing
}

export interface Bake {
  // CSS perspective, and px per world unit (elements are laid out in it)
  perspective: number
  unit: number
  tracks: Record<string, Keyframes>
}

export interface Keyframes {
  transform?: string[]
  filter?: string[]
  opacity?: number[]
}

const FACES = jacketFaces(JACKET)

const toward = (from: Vec3, to: Vec3): Vec3 => {
  const v = sub(to, from)
  return scale(v, 1 / (Math.hypot(v.x, v.y, v.z) || 1))
}

export const bakeDom = ({ height, framing }: Stage): Bake => {
  const fov = sampleShot(0, framing).camera.fov
  const perspective = height / 2 / Math.tan((fov * Math.PI) / 360)
  // A unit a bit larger than the sleeve ever gets on screen, so close-ups
  // are never upscaled
  const unit = Math.round(height * 0.62)
  const tracks: Record<string, Keyframes> = {}
  const push = (name: string, key: keyof Keyframes, value: string | number) => {
    const t = (tracks[name] ??= {})
    if (key === 'opacity') (t.opacity ??= []).push(Number(value))
    else (t[key] ??= []).push(String(value))
  }

  const samples = Math.round((CRAFT_MS / 1000) * BAKE_FPS)
  let lastDiscScreenX: number | null = null

  for (let i = 0; i <= samples; i++) {
    const ms = (i / samples) * CRAFT_MS
    const pose = sampleShot(ms, framing)
    const { camera } = pose
    const eye = cameraPosition(camera)
    const light = lightDirection(pose.light)
    // The key is a tall strip softbox: its reflection is a vertical band,
    // so only its azimuth matters for where the sheen lands
    const strip = lightDirection({ ...pose.light, elevation: 0 })
    const { target } = camera

    // Camera: move the target to the origin, turn the world against the
    // orbit, then back it off by the dolly distance from the CSS viewer
    push(
      'world',
      'transform',
      `translateZ(${r1(perspective - camera.distance * unit)}px) rotateZ(${r3(camera.roll)}deg) rotateX(${r3(-camera.pitch)}deg) rotateY(${r3(-camera.yaw)}deg) translate3d(${r1(-target.x * unit)}px, ${r1(target.y * unit)}px, ${r1(-target.z * unit)}px)`,
    )

    const focusDepth = viewDepth(camera, pose.focus)
    // Screen px of blur for a point, turned into the element's own px
    const blurAt = (point: Vec3, extraScreen = 0) => {
      const depth = Math.max(0.2, viewDepth(camera, point))
      const screen = Math.min(
        18,
        confusion(depth, focusDepth, pose.aperture) * height * 0.26,
      )
      const total = Math.hypot(screen, extraScreen)
      const local = (total * depth * unit) / perspective
      return local < 0.15 ? 'blur(0px)' : `blur(${r1(local)}px)`
    }

    for (const sleeve of SET) {
      const local = sleeve.key === 'hero' ? pose.sleeveX : 0
      const centre =
        sleeve.key === 'hero'
          ? heroToWorld({ x: local, y: 0, z: 0 })
          : { x: sleeve.x, y: 0, z: sleeve.z }
      push(`${sleeve.key}-dof`, 'filter', blurAt(centre))
      // Each face shaded by the key; the edges and bevels glint where the
      // camera sees the key's reflection, so it runs along them as it moves
      const view = toward(centre, eye)
      for (const face of FACES) {
        const lit = faceLight(
          face.normals.map((n) => yawed(n, sleeve.yaw)),
          pose.light,
          view,
        )
        push(`${sleeve.key}-shade-${face.key}`, 'opacity', lit.shade)
        if (face.key !== 'front')
          push(`${sleeve.key}-glint-${face.key}`, 'opacity', lit.glint)
      }
      // The Cover's soft sheen, where the light's reflection lands
      const lift = yawed({ x: 0, y: 0, z: JACKET.depth / 2 }, sleeve.yaw)
      const g = glint(
        eye,
        strip,
        { x: centre.x + lift.x, y: 0, z: centre.z + lift.z },
        sleeve.yaw,
      )
      const near = g ? Math.abs(g.u) : 9
      push(
        `${sleeve.key}-gloss`,
        'transform',
        `translateX(${r1(Math.max(-1.5, Math.min(1.5, g?.u ?? 1.5)) * unit)}px)`,
      )
      push(
        `${sleeve.key}-gloss`,
        'opacity',
        g
          ? r3(
              pose.light.strength *
                Math.min(1, g.facing * 1.4) *
                Math.exp(-(Math.max(0, near - 0.5) ** 2) / 0.35),
            )
          : 0,
      )
      // Cast shadow on the floor, away from the light, in the sleeve's frame
      const away = yawed(light, -sleeve.yaw)
      push(
        `${sleeve.key}-cast`,
        'transform',
        `translate(${r1(-away.x * 0.24 * unit)}px, ${r1(-away.z * 0.24 * unit)}px)`,
      )
    }

    push(
      'hero-move',
      'transform',
      `translate3d(${r1(pose.sleeveX * unit)}px, 0px, 0px)`,
    )

    // The disc: slide, focus, motion blur from its speed on screen
    const disc = heroToWorld({ x: pose.discX, y: 0, z: pose.discZ })
    const discDepth = viewDepth(camera, disc)
    const screenX = ((disc.x - eye.x) / discDepth) * perspective
    const speed =
      lastDiscScreenX === null ? 0 : Math.abs(screenX - lastDiscScreenX)
    lastDiscScreenX = screenX
    push(
      'disc-move',
      'transform',
      `translate3d(${r1(pose.discX * unit)}px, 0px, ${r1(pose.discZ * unit)}px)`,
    )
    push('disc-dof', 'filter', blurAt(disc, Math.min(7, speed * 0.22)))
    // Concentric grooves catch the light as a streak through the centre,
    // pointing at the light's reflection; brightest when it is near
    const dg = glint(eye, strip, disc, HERO.yaw)
    const angle = dg ? (Math.atan2(dg.u, dg.v) * 180) / Math.PI : 0
    const reach = dg ? Math.hypot(dg.u, dg.v) : 9
    push('disc-sheen', 'transform', `rotate(${r1(angle)}deg)`)
    push(
      'disc-sheen',
      'opacity',
      dg
        ? r3(
            pose.light.strength *
              (0.35 + 0.65 * Math.exp(-((reach / (DISC.diameter * 0.9)) ** 2))),
          )
        : 0.15,
    )
    const away = yawed(light, -HERO.yaw)
    push(
      'disc-shadow',
      'transform',
      `translate(${r1((pose.discX - away.x * 0.2) * unit)}px, ${r1((pose.discZ - away.z * 0.2) * unit)}px)`,
    )
    push('exposure', 'opacity', r3(1 - pose.exposure))
  }

  return { perspective, unit, tracks }
}
