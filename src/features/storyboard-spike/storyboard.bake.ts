// The storyboard baked for CSS 3D: the pose sampled 30 times a second into
// each moving part's keyframes (transform, filter, opacity). Motion plays
// them as WAAPI animations, linear between samples (ADR 0005).
import {
  cameraPosition,
  confusion,
  lightDirection,
  viewDepth,
} from '#/features/engine-spike/craft.score'
import type { Vec3 } from '#/features/engine-spike/craft.score'
import { glint } from '#/features/engine-spike/dom-bake'
import type { Keyframes } from '#/features/engine-spike/dom-bake'
import { faceLight, jacketFaces } from '#/features/engine-spike/jacket.utils'
import type { JacketSize } from '#/features/engine-spike/jacket.utils'

import { JACKET_DEPTH, discWorld, orient, sampleStory } from './storyboard.pose'
import type { Placement } from './storyboard.pose'
import { STORY_MS } from './storyboard.score'
import type { Framing } from './storyboard.score'

export const BAKE_FPS = 30

export const JACKET: JacketSize = {
  depth: JACKET_DEPTH,
  bevel: 0.007,
  wall: 0.006,
}
export const FACES = jacketFaces(JACKET)

const r3 = (n: number) => Math.round(n * 1000) / 1000
const r1 = (n: number) => Math.round(n * 10) / 10
const clamp01 = (n: number) => Math.min(1, Math.max(0, n))

const sub = (a: Vec3, b: Vec3): Vec3 => ({
  x: a.x - b.x,
  y: a.y - b.y,
  z: a.z - b.z,
})
const unit3 = (v: Vec3): Vec3 => {
  const l = Math.hypot(v.x, v.y, v.z) || 1
  return { x: v.x / l, y: v.y / l, z: v.z / l }
}

export interface Stage {
  width: number
  height: number
  framing: Framing
}

export interface Bake {
  perspective: number
  unit: number
  tracks: Record<string, Keyframes>
}

export const placeCss = (p: Placement, unit: number) =>
  `translate3d(${r1(p.x * unit)}px, ${r1(-p.y * unit)}px, ${r1(p.z * unit)}px) rotateY(${r3(p.yaw)}deg) rotateX(${r3(p.pitch)}deg) rotateZ(${r3(p.roll)}deg)`

export const bakeStory = ({ height, framing }: Stage): Bake => {
  const first = sampleStory(0, framing)
  const perspective = height / 2 / Math.tan((first.camera.fov * Math.PI) / 360)
  // A unit a bit larger than a sleeve ever gets on screen, so close-ups are
  // never upscaled
  const unit = Math.round(height * 0.72)
  const tracks: Record<string, Keyframes> = {}
  const push = (name: string, key: keyof Keyframes, value: string | number) => {
    const t = (tracks[name] ??= {})
    if (key === 'opacity') (t.opacity ??= []).push(Number(value))
    else (t[key] ??= []).push(String(value))
  }

  const samples = Math.round((STORY_MS / 1000) * BAKE_FPS)
  let lastDisc: Vec3 | null = null

  for (let n = 0; n <= samples; n++) {
    const ms = (n / samples) * STORY_MS
    const pose = sampleStory(ms, framing)
    const { camera } = pose
    const eye = cameraPosition(camera)
    const light = lightDirection(pose.light)
    const strip = lightDirection({ ...pose.light, elevation: 0 })
    const { target } = camera

    push(
      'world',
      'transform',
      `translateZ(${r1(perspective - camera.distance * unit)}px) rotateZ(${r3(camera.roll)}deg) rotateX(${r3(-camera.pitch)}deg) rotateY(${r3(-camera.yaw)}deg) translate3d(${r1(-target.x * unit)}px, ${r1(target.y * unit)}px, ${r1(-target.z * unit)}px)`,
    )

    const focusDepth = Math.max(0.3, viewDepth(camera, pose.focus))
    const blurAt = (point: Vec3, extraScreen = 0) => {
      const depth = Math.max(0.2, viewDepth(camera, point))
      const screen = Math.min(
        16,
        confusion(depth, focusDepth, pose.aperture) * height * 0.24,
      )
      const total = Math.hypot(screen, extraScreen)
      // Into the element's own px: it is drawn at `unit` and scaled by depth
      const local = (total * depth * unit) / perspective
      return local < 0.2 ? 'blur(0px)' : `blur(${r1(local)}px)`
    }

    // A shadow on the wall (z = 0) from something `z` in front of it
    const onWall = (x: number, y: number, z: number) => {
      const k = Math.max(0, z) / Math.max(0.25, light.z)
      return {
        x: x - light.x * k,
        y: y - light.y * k,
      }
    }

    pose.wall.forEach((w, i) => {
      const name = `w${i}`
      push(name, 'transform', placeCss(w, unit))
      push(`${name}-dof`, 'filter', blurAt(w))
      push(`${name}-edge`, 'opacity', r3(clamp01(w.cover * 3)))
      // Unlit until the sweep has passed it
      const lit = clamp01((pose.sweepX - w.x) / 1.2 + 0.5)
      push(`${name}-dim`, 'opacity', r3(Math.max(pose.dim, (1 - lit) * 0.42)))
      // The sweep: a band of light crossing the wall, on each Cover where
      // it overlaps
      push(
        `${name}-gloss`,
        'transform',
        `translateX(${r1(Math.max(-2, Math.min(2, pose.sweepX - w.x)) * unit)}px)`,
      )
      push(`${name}-gloss`, 'opacity', r3(pose.sweep * w.cover))
      const sh = onWall(w.x, w.y, w.z + 0.05)
      push(
        `${name}-shadow`,
        'transform',
        `translate3d(${r1(sh.x * unit)}px, ${r1(-sh.y * unit)}px, 1px) scale(${r3(1 + w.z * 0.35)})`,
      )
      push(
        `${name}-shadow`,
        'opacity',
        r3(w.cover * clamp01(0.35 + w.z * 3) * pose.light.strength),
      )
    })

    pose.stack.forEach((p, k) => {
      const name = `s${k}`
      push(name, 'transform', placeCss(p, unit))
      push(`${name}-dof`, 'filter', blurAt(p))
      const view = unit3(sub(eye, p))
      for (const face of FACES) {
        const lit = faceLight(
          face.normals.map((nv) => orient(nv, p)),
          pose.light,
          view,
        )
        push(`${name}-shade-${face.key}`, 'opacity', lit.shade)
        if (face.key !== 'front')
          push(`${name}-glint-${face.key}`, 'opacity', lit.glint)
      }
      const back = faceLight(
        [orient({ x: 0, y: 0, z: -1 }, p)],
        pose.light,
        view,
      )
      push(`${name}-shade-back`, 'opacity', back.shade)
      push(`${name}-dim`, 'opacity', r3(k < 2 ? pose.dim : 0))
      // The Cover's sheen where the strip's reflection lands, once upright
      const g =
        Math.abs(p.pitch) < 30
          ? glint(eye, strip, { x: p.x, y: p.y, z: p.z }, p.yaw)
          : null
      push(
        `${name}-gloss`,
        'transform',
        `translateX(${r1(Math.max(-1.5, Math.min(1.5, g?.u ?? 1.5)) * unit)}px)`,
      )
      push(
        `${name}-gloss`,
        'opacity',
        g
          ? r3(
              pose.light.strength *
                Math.min(1, g.facing * 1.4) *
                Math.exp(-(Math.max(0, Math.abs(g.u) - 0.5) ** 2) / 0.35),
            )
          : 0,
      )
      // The scan: the line over the barcode, the hit's flash
      push(`${name}-line`, 'transform', `translateY(${r1(p.line * 100)}%)`)
      push(`${name}-scan`, 'opacity', r3(p.scanning))
      push(`${name}-hit`, 'opacity', r3(p.hit))
      // On the floor: a soft shadow away from the key, gone once airborne
      push(
        `${name}-shadow`,
        'transform',
        `translate3d(${r1((p.x - light.x * 0.06) * unit)}px, ${r1(p.z * unit)}px, 0px) rotate(${r3(-(p.roll - 180))}deg)`,
      )
      push(`${name}-shadow`, 'opacity', r3(1 - p.airborne))
      // Upright before the wall: its shadow on the wall
      const upright = clamp01(1 - Math.abs(p.pitch) / 60) ** 2
      const ws = onWall(p.x, p.y, p.z + 0.04)
      push(
        `${name}-wallshadow`,
        'transform',
        `translate3d(${r1(ws.x * unit)}px, ${r1(-ws.y * unit)}px, 1px) rotateZ(${r3(-p.yaw * 0.15)}deg) scale(${r3(1 + p.z * 0.3)}, ${r3(1 + p.z * 0.12)})`,
      )
      push(
        `${name}-wallshadow`,
        'opacity',
        r3((upright * pose.light.strength) / (1 + p.z * 0.9)),
      )
    })

    // The disc: slide, focus, motion blur from its speed on screen
    const disc = discWorld(pose)
    const speed = lastDisc
      ? (Math.hypot(disc.x - lastDisc.x, disc.y - lastDisc.y) * perspective) /
        Math.max(0.3, viewDepth(camera, disc))
      : 0
    lastDisc = disc
    push(
      'disc-move',
      'transform',
      `translate3d(${r1(pose.disc * unit)}px, 0px, 0px)`,
    )
    push(
      'disc-dof',
      'filter',
      pose.disc > 0.02 ? blurAt(disc, Math.min(6, speed * 0.2)) : 'blur(0px)',
    )
    const hero = pose.stack[2]
    const dg = glint(eye, strip, disc, hero.yaw)
    const angle = dg ? (Math.atan2(dg.u, dg.v) * 180) / Math.PI : 0
    const reach = dg ? Math.hypot(dg.u, dg.v) : 9
    push('disc-sheen', 'transform', `rotate(${r1(angle)}deg)`)
    push(
      'disc-sheen',
      'opacity',
      dg
        ? r3(
            pose.light.strength *
              (0.35 + 0.65 * Math.exp(-((reach / 0.85) ** 2))),
          )
        : 0.15,
    )

    push('exposure', 'opacity', r3(1 - pose.exposure))
    push('grade', 'opacity', r3(pose.grade))
    push('hud', 'opacity', r3(pose.hud.on))
    push('hud', 'transform', `translateY(${r1((1 - pose.hud.on) * 14)}px)`)
    for (let c = 1; c <= 3; c++) {
      // Each count rolls up into place and out as the next arrives
      const here = clamp01(pose.hud.count - (c - 1))
      const gone = clamp01(pose.hud.count - c)
      push(`hud-n${c}`, 'opacity', r3(here * (1 - gone)))
      push(
        `hud-n${c}`,
        'transform',
        `translateY(${r1((1 - here) * 60 - gone * 60)}%)`,
      )
    }
    push('hud-btn', 'opacity', r3(pose.hud.button))
    push('hud-hint', 'opacity', r3(1 - Math.min(1, pose.hud.button * 2)))
    push(
      'hud-btn',
      'transform',
      `translateY(${r1((1 - pose.hud.button) * 8)}px) scale(${r3(1 - pose.hud.press * 0.05)})`,
    )
    push('hud-press', 'opacity', r3(pose.hud.press))
  }

  return { perspective, unit, tracks }
}
