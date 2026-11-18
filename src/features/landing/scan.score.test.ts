import { describe, expect, it } from 'vitest'

import { playheadAt } from './film/film.model'
import { SCAN_PASS_MS, SCAN_SCORE, SCAN_TRACKS } from './scan.score'
import type { ScanTrack } from './scan.score'

const opacity = (name: ScanTrack, ms: number) =>
  SCAN_SCORE.sample(ms)[name]?.opacity ?? 0

// The first moment in [from, to) a track is fully shown
const firstShown = (name: ScanTrack, from: number, to: number) => {
  for (let ms = from; ms < to; ms += 10) if (opacity(name, ms) >= 1) return ms
  return Infinity
}

const PASSES = [
  { start: 0, sleeve: 'held:a', panel: 'panel:a', sent: 'sent:a' },
  { start: SCAN_PASS_MS, sleeve: 'held:b', panel: 'panel:b', sent: 'sent:b' },
] as const

describe('SCAN_SCORE', () => {
  it('loops two passes, one sleeve each, from the start', () => {
    expect(SCAN_SCORE.length).toBe(2 * SCAN_PASS_MS)
    expect(SCAN_SCORE.ending).toEqual({ kind: 'loop', from: 0 })
    expect(playheadAt(SCAN_SCORE, 3 * SCAN_PASS_MS + 100)).toEqual({
      part: 'loop',
      ms: SCAN_PASS_MS + 100,
    })
  })

  it.each(PASSES)(
    'scans, matches, then sends the sleeve, in that order ($sleeve)',
    ({ start, sleeve, panel, sent }) => {
      const end = start + SCAN_PASS_MS
      const lifted = firstShown(sleeve, start, end)
      const locked = firstShown('finder', start, end)
      const swept = firstShown('scanline', start, end)
      const flashed = [...Array(SCAN_PASS_MS / 10).keys()]
        .map((i) => start + i * 10)
        .find((ms) => opacity('flash', ms) > 0)
      const matched = firstShown(panel, start, end)
      const added = firstShown(sent, start, end)

      expect(lifted).toBeLessThan(locked)
      expect(locked).toBeLessThan(swept)
      expect(swept).toBeLessThan(flashed ?? Infinity)
      expect(flashed).toBeLessThan(matched)
      expect(matched).toBeLessThan(added)
      expect(added).toBeLessThan(end)
    },
  )

  it('sends the first sleeve to the Collection, the second to the Wantlist, switching first', () => {
    const [a, b] = PASSES
    // The first pass never offers the Wantlist; the second switches to it
    // once matched, before adding
    const switched = firstShown('bar:wantlist', b.start, b.start + SCAN_PASS_MS)
    expect(firstShown('bar:wantlist', a.start, b.start)).toBe(Infinity)
    expect(switched).toBeGreaterThan(firstShown('panel:b', b.start, Infinity))
    expect(switched).toBeLessThan(firstShown('sent:b', b.start, Infinity))
    expect(opacity('bar:collection', switched)).toBe(0)
  })

  it('holds one sleeve in hand at a time, and one panel', () => {
    for (let ms = 0; ms < SCAN_SCORE.length; ms += 20) {
      expect(opacity('held:a', ms) * opacity('held:b', ms)).toBe(0)
      expect(opacity('panel:a', ms) * opacity('panel:b', ms)).toBe(0)
    }
  })

  it('wraps seamlessly: the end looks like the start', () => {
    expect(SCAN_SCORE.sample(SCAN_SCORE.length)).toEqual(SCAN_SCORE.sample(0))
  })

  it('swaps a crate sleeve for the one in hand unseen: same place, same instant', () => {
    for (const [crate, held] of [
      ['crate:a', 'held:a'],
      ['crate:b', 'held:b'],
    ] as const) {
      const lift = firstShown(held, 0, SCAN_SCORE.length)
      const before = SCAN_SCORE.sample(lift - 1)
      const after = SCAN_SCORE.sample(lift)
      expect(before[crate]?.opacity).toBe(1)
      expect(after[crate]?.opacity).toBe(0)
      expect(after[held]?.transform).toEqual(before[crate]?.transform)
      expect(SCAN_SCORE.cuts).toContain(lift)
    }
  })

  it('turns the sleeve over: its Cover in the crate, its barcode side in hand', () => {
    expect(opacity('front:a', 0)).toBe(1)
    expect(opacity('back:a', 0)).toBe(0)
    // Held up to the viewfinder
    expect(opacity('front:a', 2200)).toBe(0)
    expect(opacity('back:a', 2200)).toBe(1)
  })

  it('cuts where the flash jumps on', () => {
    const on = [...Array(SCAN_PASS_MS).keys()].find(
      (ms) => opacity('flash', ms) > 0,
    )
    expect(SCAN_SCORE.cuts).toContain(on)
  })

  it('moves only transforms and opacity: never an animated blur', () => {
    for (let ms = 0; ms <= SCAN_SCORE.length; ms += 50)
      for (const part of Object.values(SCAN_SCORE.sample(ms)))
        expect(part).not.toHaveProperty('blur')
  })

  it('pulls focus off the sleeve to the panel with a soft twin of the crate', () => {
    for (const { start } of PASSES) {
      expect(opacity('set:soft', start + 1500)).toBe(0)
      expect(opacity('set:sharp', start + 1500)).toBe(1)
      expect(opacity('set:soft', start + 4000)).toBe(1)
      expect(opacity('set:sharp', start + 4000)).toBe(0)
    }
  })

  it('animates only its own tracks', () => {
    for (const ms of [0, 2000, 7000])
      for (const name of Object.keys(SCAN_SCORE.sample(ms)))
        expect(SCAN_TRACKS).toContain(name)
  })
})

describe('the still', () => {
  it('is the first sleeve matched, ready to add to the Collection', () => {
    const shot = SCAN_SCORE.sample(SCAN_SCORE.still)
    expect(SCAN_SCORE.still).toBeLessThan(SCAN_PASS_MS)
    expect(shot['panel:a']?.opacity).toBe(1)
    expect(shot['bar:collection']?.opacity).toBe(1)
    expect(shot['held:a']?.opacity).toBe(1)
    for (const name of ['finder', 'scanline', 'flash', 'sent:a'] as const)
      expect([name, shot[name]?.opacity]).toEqual([name, 0])
  })
})
