import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

import type { Look } from './film/film.model'
import { ARTIST_LEADER, DECADE_LEADER, PORTRAIT_SCORE } from './portrait.score'
import type { PortraitTrack } from './portrait.score'

const { length, sample, still } = PORTRAIT_SCORE

const look = (name: PortraitTrack, ms: number): Look => {
  const found = sample(ms)[name]
  if (!found) throw new Error(`No ${name} at ${ms}ms`)
  return found
}

// How far a bar is drawn: its scale along its axis
const drawn = (name: PortraitTrack, ms: number) => {
  const [move] = look(name, ms).transform ?? []
  if ('scaleX' in move) return move.scaleX
  if ('scaleY' in move) return move.scaleY
  throw new Error(`${name} doesn't draw`)
}
const copper = (name: PortraitTrack, ms: number) => look(name, ms).draw ?? 0

// The first moment `test` holds, to 50ms
const firstAt = (test: (ms: number) => boolean) => {
  for (let ms = 0; ms <= length; ms += 50) if (test(ms)) return ms
  return Infinity
}

const artistBars = Array.from(
  { length: 5 },
  (_, i) => `artistBar:${i}` as const,
)
const decadeBars = Array.from(
  { length: 7 },
  (_, i) => `decadeBar:${i}` as const,
)
const bars = [...artistBars, ...decadeBars]
const artistLeader = artistBars[ARTIST_LEADER]
const decadeLeader = decadeBars[DECADE_LEADER]

describe('PORTRAIT_SCORE', () => {
  it('loops from the start, its last frame its first', () => {
    expect(PORTRAIT_SCORE.ending).toEqual({ kind: 'loop', from: 0 })
    expect(sample(length)).toEqual(sample(0))
  })

  it('opens on every bar undrawn and no copper, as the CSS rests them', () => {
    for (const name of bars) {
      expect(drawn(name, 0)).toBe(0)
      expect(copper(name, 0)).toBe(0)
    }
    const css = readFileSync(
      new URL('../../styles.css', import.meta.url),
      'utf8',
    )
    expect(css).toMatch(/\.portrait-film \.portrait-bar \{[^}]*scaleX\(0\)/)
    expect(css).toMatch(/\.portrait-film \.portrait-column \{[^}]*scaleY\(0\)/)
    expect(css).toMatch(/\.portrait-film \{[^}]*--film-undrawn: 1/)
    expect(look('decadeCount:0', 0).opacity).toBe(0)
    expect(css).toMatch(
      /\.portrait-film span:has\(\+ \.portrait-column\) \{[^}]*opacity: 0/,
    )
  })

  it('leads with the charts’ own leaders: Marisol Okafor, the 1970s', () => {
    expect(ARTIST_LEADER).toBe(0)
    expect(DECADE_LEADER).toBe(1)
  })

  it('draws the Top artists bars one after another, top first', () => {
    const starts = artistBars.map((name) =>
      firstAt((ms) => drawn(name, ms) > 0),
    )
    expect(starts).toEqual([...starts].sort((a, b) => a - b))
    expect(new Set(starts).size).toBe(starts.length)
  })

  it('turns a leader copper once its bar is whole, and only the leaders', () => {
    for (const leader of [artistLeader, decadeLeader]) {
      const whole = firstAt((ms) => drawn(leader, ms) === 1)
      expect(firstAt((ms) => copper(leader, ms) > 0)).toBeGreaterThan(whole)
    }
    for (const name of bars)
      if (name !== artistLeader && name !== decadeLeader)
        expect(look(name, still).draw).toBeUndefined()
  })

  it('draws Pressing decade once the artists’ leader is copper', () => {
    const artistsCopper = firstAt((ms) => copper(artistLeader, ms) === 1)
    const columnsStart = firstAt((ms) => drawn(decadeBars[0], ms) > 0)
    expect(columnsStart).toBeGreaterThan(artistsCopper)
  })

  it('hides every bar before undrawing it, so the wrap is never seen', () => {
    for (const name of bars) {
      const undrawnAt = firstAt(
        (ms) => ms > 1000 && drawn(name, ms) < drawn(name, ms - 50),
      )
      expect(undrawnAt).toBeLessThan(length)
      expect(look(name, undrawnAt - 50).opacity).toBe(0)
    }
  })

  it('holds a still: the sheet in focus, every bar whole, leaders copper', () => {
    for (const name of bars) {
      expect(drawn(name, still)).toBe(1)
      expect(look(name, still).opacity).toBe(1)
    }
    expect(copper(artistLeader, still)).toBe(1)
    expect(copper(decadeLeader, still)).toBe(1)
    for (const part of ['figures', 'artists', 'decades'] as const) {
      expect(look(part, still).opacity).toBe(1)
    }
    for (const part of ['figures', 'decades'] as const) {
      expect(look(`${part}:soft`, still).opacity).toBe(0)
      expect(look(`${part}:sharp`, still).opacity).toBe(1)
    }
  })

  it('shows a column’s count only as its column tops out', () => {
    for (const [i, column] of decadeBars.entries()) {
      const count = `decadeCount:${i}` as const
      expect(look(count, 0).opacity).toBe(0)
      const shown = firstAt((ms) => (look(count, ms).opacity ?? 0) > 0)
      expect(drawn(column, shown)).toBeGreaterThan(0.5)
      expect(look(count, still).opacity).toBe(1)
    }
  })

  // The copper is drawn on the main thread (a custom property), which can run
  // late against the bars' compositor clock: it clears as soon as the bars
  // are hidden, so the leaders have the whole hidden stretch to catch up
  it('clears the copper the moment the bars are hidden', () => {
    for (const leader of [artistLeader, decadeLeader]) {
      const hidden = firstAt(
        (ms) => ms > still && look(leader, ms).opacity === 0,
      )
      const cleared = firstAt((ms) => ms > still && copper(leader, ms) === 0)
      expect(cleared - hidden).toBeLessThanOrEqual(100)
      const jump = PORTRAIT_SCORE.cuts.find(
        (cut) => copper(leader, cut) === 0 && copper(leader, cut - 1) === 1,
      )
      expect(jump).toBeDefined()
    }
  })

  it('racks focus with soft twins of the figures and Pressing decade, never Top artists', () => {
    // Out of focus at the start, the twin over the sharp part
    expect(look('decades:soft', 0).opacity).toBe(1)
    expect(look('decades:sharp', 0).opacity).toBe(0)
    expect(look('figures:soft', 0).opacity).toBe(1)
    // Top artists' bars move while it's soft: a blur would repaint them
    expect(PORTRAIT_SCORE.tracks).not.toContain('artists:soft')
  })

  it('moves only transforms and opacity: never an animated blur', () => {
    for (let ms = 0; ms <= PORTRAIT_SCORE.length; ms += 50)
      for (const part of Object.values(PORTRAIT_SCORE.sample(ms)))
        expect(part).not.toHaveProperty('blur')
  })

  it('cuts where the bars jump back to undrawn', () => {
    for (const name of bars) {
      const jump = PORTRAIT_SCORE.cuts.find(
        (cut) => drawn(name, cut) === 0 && drawn(name, cut - 1) === 1,
      )
      expect(jump).toBeDefined()
    }
  })
})
