import { describe, expect, it } from 'vitest'

import { JACKET, faceLight, jacketFaces } from './jacket.utils'

const faces = jacketFaces(JACKET)
const face = (key: string) => {
  const f = faces.find((x) => x.key === key)
  if (!f) throw new Error(`no face ${key}`)
  return f
}

describe('jacketFaces', () => {
  it('has a printed front, a spine, top and bottom seams, the mouth and four bevels', () => {
    expect(faces.map((f) => f.key).sort()).toEqual(
      [
        'front',
        'spine',
        'top',
        'bottom',
        'mouth',
        'bevel-left',
        'bevel-right',
        'bevel-top',
        'bevel-bottom',
      ].sort(),
    )
  })

  it('gives every face a unit normal pointing out of the jacket', () => {
    for (const f of faces) {
      expect(Math.hypot(f.normal.x, f.normal.y, f.normal.z)).toBeCloseTo(1)
      const outward =
        f.normal.x * f.centre.x +
        f.normal.y * f.centre.y +
        f.normal.z * f.centre.z
      expect(outward).toBeGreaterThan(0)
    }
  })

  it('has real thickness: the spine is as deep as the jacket, less its bevel', () => {
    const { depth, bevel } = JACKET
    expect(depth).toBeGreaterThanOrEqual(0.02)
    expect(face('spine').width).toBeCloseTo(depth - bevel)
    expect(face('spine').normal).toEqual({ x: -1, y: 0, z: 0 })
    expect(face('mouth').normal).toEqual({ x: 1, y: 0, z: 0 })
  })

  it('rounds each bevel from just off the front to its edge', () => {
    const { normals } = face('bevel-left')
    // 30° off the front, toward the spine
    expect(normals[0].z).toBeCloseTo(Math.cos(Math.PI / 6))
    expect(normals[0].x).toBeCloseTo(-0.5)
    expect(normals.at(-1)?.x).toBeCloseTo(-1)
    expect(normals.at(-1)?.z).toBeCloseTo(0)
  })

  it('bevels each front edge at 45°, so the front is inset by the bevel', () => {
    const { bevel } = JACKET
    expect(face('front').width).toBeCloseTo(1 - 2 * bevel)
    expect(face('bevel-left').width).toBeCloseTo(bevel * Math.SQRT2)
    expect(face('bevel-left').normal.x).toBeCloseTo(-Math.SQRT1_2)
    expect(face('bevel-left').normal.z).toBeCloseTo(Math.SQRT1_2)
    expect(face('bevel-top').normal.y).toBeCloseTo(Math.SQRT1_2)
  })

  it('places each face with a CSS transform in px of the unit', () => {
    // 400px per sleeve: the spine sits on the left edge, turned to face left
    expect(face('spine').transform(400)).toBe(
      `translate3d(-200px, 0px, ${-JACKET.bevel * 200}px) rotateY(-90deg)`,
    )
    expect(face('front').transform(400)).toBe(
      `translate3d(0px, 0px, ${JACKET.depth * 200}px)`,
    )
  })
})

describe('faceLight', () => {
  // The key from the front left, level; a vertical edge facing left
  const key = { azimuth: -45, elevation: 0, strength: 1 }
  const left = [{ x: -1, y: 0, z: 0 }]
  const right = [{ x: 1, y: 0, z: 0 }]
  const front = { x: 0, y: 0, z: 1 }
  const mirror = { x: -Math.SQRT1_2, y: 0, z: -Math.SQRT1_2 }

  it('shades a face turned from the light darker than one facing it', () => {
    expect(faceLight(right, key, front).shade).toBeGreaterThan(
      faceLight(left, key, front).shade,
    )
  })

  it('makes an edge catch the light only when the camera sees its reflection', () => {
    expect(faceLight(left, key, mirror).glint).toBeGreaterThan(0.9)
    expect(faceLight(left, key, front).glint).toBeLessThan(0.1)
  })

  it('reflects a tall strip: a vertical edge glints from a level camera under a high key', () => {
    const high = { ...key, elevation: 40 }
    expect(faceLight(left, high, mirror).glint).toBeGreaterThan(0.9)
  })

  it('glints along a rounded bevel over a range of views, where a flat face would not', () => {
    const bevel = face('bevel-left').normals
    const flat = [face('bevel-left').normal]
    const view = (azimuth: number) => {
      const a = (azimuth * Math.PI) / 180
      return { x: Math.sin(a), y: 0, z: Math.cos(a) }
    }
    const keyFront = { azimuth: -20, elevation: 0, strength: 1 }
    // Half-vectors at -40° and -65°: both on the fillet's arc (0° to -90°)
    expect(faceLight(bevel, keyFront, view(-60)).glint).toBeGreaterThan(0.9)
    expect(faceLight(bevel, keyFront, view(-110)).glint).toBeGreaterThan(0.9)
    expect(faceLight(flat, keyFront, view(-110)).glint).toBeLessThan(0.5)
  })

  it('never lights a face turned away from the light', () => {
    expect(faceLight(right, key, { x: 1, y: 0, z: 0 }).glint).toBe(0)
  })
})
