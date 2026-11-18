// A score baked for the DOM (ADR 0005): each part sampled 30 times a second,
// and at every cut, into keyframes per tracked element (transform, opacity,
// filter, the stroke drawn), linear between samples. The curves are the
// score's own; Motion only plays them.
import { partSpan } from './film.model'
import type { Look, Move, Part, Score } from './film.model'

export const BAKE_FPS = 30

const r3 = (n: number) => Math.round(n * 1000) / 1000
const length = (n: number) => `${r3(n)}cqw`

const moveCss = (move: Move): string => {
  if ('perspective' in move) return `perspective(${r3(move.perspective)}px)`
  if ('translate' in move) {
    const [x, y, z] = move.translate
    return z === undefined
      ? `translate(${length(x)}, ${length(y)})`
      : `translate3d(${length(x)}, ${length(y)}, ${length(z)})`
  }
  if ('rotateX' in move) return `rotateX(${r3(move.rotateX)}deg)`
  if ('rotateY' in move) return `rotateY(${r3(move.rotateY)}deg)`
  if ('rotateZ' in move) return `rotate(${r3(move.rotateZ)}deg)`
  return `scale(${r3(move.scale)})`
}

export const transformCss = (moves: readonly Move[]) =>
  moves.map(moveCss).join(' ')

// The drawn share reaches the stroke as a custom property: the film's CSS
// sets `stroke-dashoffset: var(--film-undrawn)` on a `pathLength="1"` path
export interface LookCss {
  opacity?: number
  transform?: string
  filter?: string
  '--film-undrawn'?: number
}

export const lookStyle = ({
  opacity,
  transform,
  blur,
  draw,
}: Look): LookCss => ({
  ...(opacity !== undefined && { opacity: r3(opacity) }),
  ...(transform && { transform: transformCss(transform) }),
  ...(blur !== undefined && { filter: `blur(${length(blur)})` }),
  ...(draw !== undefined && { '--film-undrawn': r3(1 - draw) }),
})

export type Keyframes = {
  opacity?: number[]
  transform?: string[]
  filter?: string[]
  '--film-undrawn'?: number[]
}

export interface Bake<TName extends string> {
  // The part's length, ms
  duration: number
  // Each sample's offset into the part, 0 to 1, shared by every track
  times: number[]
  tracks: Partial<Record<TName, Keyframes>>
}

// When to sample [start, end]: 30 times a second, and every cut inside
const sampleTimes = (
  start: number,
  end: number,
  cuts: readonly number[],
): number[] => {
  const steps = Math.max(1, Math.round(((end - start) / 1000) * BAKE_FPS))
  const grid = Array.from(
    { length: steps + 1 },
    (_, i) => start + ((end - start) * i) / steps,
  )
  const inside = cuts.filter((cut) => cut > start && cut < end)
  // A cut replaces a grid sample closer than a millisecond
  const kept = grid.filter((t) => inside.every((cut) => Math.abs(cut - t) >= 1))
  return [...kept, ...inside].sort((a, b) => a - b)
}

const append = (keyframes: Keyframes, look: Look) => {
  const css = lookStyle(look)
  if (css.opacity !== undefined) (keyframes.opacity ??= []).push(css.opacity)
  if (css.transform !== undefined)
    (keyframes.transform ??= []).push(css.transform)
  if (css.filter !== undefined) (keyframes.filter ??= []).push(css.filter)
  if (css['--film-undrawn'] !== undefined)
    (keyframes['--film-undrawn'] ??= []).push(css['--film-undrawn'])
}

export const bakePart = <TName extends string>(
  score: Score<TName>,
  part: Part,
): Bake<TName> => {
  const [start, end] = partSpan(score, part)
  const duration = end - start
  const at = duration === 0 ? [start] : sampleTimes(start, end, score.cuts)
  const tracks: Partial<Record<TName, Keyframes>> = {}

  for (const ms of at) {
    const shot = score.sample(ms)
    for (const name of score.tracks) {
      const look = shot[name]
      if (look) append((tracks[name] ??= {}), look)
    }
  }

  return {
    duration,
    times: at.map((ms) => (duration === 0 ? 0 : (ms - start) / duration)),
    tracks,
  }
}
