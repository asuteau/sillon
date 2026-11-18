// A score baked for the DOM (ADR 0005): each part sampled 30 times a second,
// and at every cut, into keyframes per tracked element (transform, opacity,
// filter, the stroke drawn), linear between samples. The curves are the
// score's own; the browser only plays them.
import { partSpan, round3 } from './film.model'
import type { Look, Move, Part, Score } from './film.model'

export const BAKE_FPS = 30

const length = (n: number) => `${round3(n)}cqw`

const moveCss = (move: Move): string => {
  if ('perspective' in move) return `perspective(${round3(move.perspective)}px)`
  if ('translate' in move) {
    const [x, y, z] = move.translate
    return z === undefined
      ? `translate(${length(x)}, ${length(y)})`
      : `translate3d(${length(x)}, ${length(y)}, ${length(z)})`
  }
  if ('rotateX' in move) return `rotateX(${round3(move.rotateX)}deg)`
  if ('rotateY' in move) return `rotateY(${round3(move.rotateY)}deg)`
  if ('rotateZ' in move) return `rotate(${round3(move.rotateZ)}deg)`
  if ('scaleX' in move) return `scaleX(${round3(move.scaleX)})`
  if ('scaleY' in move) return `scaleY(${round3(move.scaleY)})`
  return `scale(${round3(move.scale)})`
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
  ...(opacity !== undefined && { opacity: round3(opacity) }),
  ...(transform && { transform: transformCss(transform) }),
  ...(blur !== undefined && { filter: `blur(${length(blur)})` }),
  ...(draw !== undefined && { '--film-undrawn': round3(1 - draw) }),
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

// The numbers in a keyframe value, and its shape around them: two values
// of one shape mix number by number, as the browser interpolates them
const NUMBER = /-?\d*\.?\d+(?:e-?\d+)?/g
const numbersOf = (value: string | number) =>
  typeof value === 'number'
    ? { shape: '', numbers: [value] }
    : {
        shape: value.replace(NUMBER, '#'),
        numbers: (value.match(NUMBER) ?? []).map(Number),
      }

// How far a dropped sample may stray from the line the browser draws: a
// fiftieth of a stage unit (under a pixel on a phone) or of a degree is
// never seen
const TOLERANCE = 0.02

// One track's keyframes without the samples the browser would draw anyway:
// where a value holds, or runs straight, only the run's two ends stay. Null
// for a track that never changes: React's rest pose already shows it.
// Fewer keyframes are quicker to start, and nothing to interpolate while a
// part holds still
export const withoutHolds = (
  times: readonly number[],
  keyframes: Keyframes,
): { times: number[]; keyframes: Keyframes } | null => {
  const values = Object.values(keyframes).map((v: Array<string | number>) =>
    v.map(numbersOf),
  )
  // Does the line from sample a to sample b pass through sample i?
  const onLine = (a: number, i: number, b: number) => {
    const t = (times[i] - times[a]) / (times[b] - times[a])
    return values.every((v) => {
      const [from, at, to] = [v[a], v[i], v[b]]
      if (from.shape !== at.shape || at.shape !== to.shape) return false
      return at.numbers.every(
        (n, k) =>
          Math.abs(
            from.numbers[k] + (to.numbers[k] - from.numbers[k]) * t - n,
          ) <= TOLERANCE,
      )
    })
  }
  const last = times.length - 1
  const kept = [0]
  for (let i = 1; i < last; i++) {
    const anchor = kept[kept.length - 1]
    // This sample, and the one halfway since the last kept, on the line to
    // the next: linear in the run's length, close enough for eased curves
    const half = Math.ceil((anchor + i) / 2)
    if (!onLine(anchor, i, i + 1) || !onLine(anchor, half, i + 1)) kept.push(i)
  }
  if (last > 0) kept.push(last)
  const same = (i: number, j: number) =>
    values.every(
      (v) =>
        v[i].shape === v[j].shape &&
        v[i].numbers.every((n, k) => n === v[j].numbers[k]),
    )
  if (kept.every((i) => same(0, i))) return null
  const pick = <T>(v: T[] | undefined) => v && kept.map((i) => v[i])
  return {
    times: kept.map((i) => times[i]),
    keyframes: {
      ...(keyframes.opacity && { opacity: pick(keyframes.opacity) }),
      ...(keyframes.transform && { transform: pick(keyframes.transform) }),
      ...(keyframes.filter && { filter: pick(keyframes.filter) }),
      ...(keyframes['--film-undrawn'] && {
        '--film-undrawn': pick(keyframes['--film-undrawn']),
      }),
    },
  }
}

// One track's keyframes as the Web Animations API takes them: a keyframe
// per sample, at its offset into the part
export const waapiKeyframes = (
  times: readonly number[],
  keyframes: Keyframes,
): Keyframe[] =>
  times.map((offset, i) => {
    const frame: Keyframe = { offset }
    for (const [property, values] of Object.entries(keyframes))
      frame[property] = values[i]
    return frame
  })

// Bakes a part a few samples at a time: it pauses (yields) between steps,
// so a long film can be baked across frames without holding the page up
export const bakeInSteps = <TName extends string>(
  score: Score<TName>,
  part: Part,
  samplesPerStep = Infinity,
): Generator<void, Bake<TName>> =>
  bakeSpanInSteps(score, partSpan(score, part), samplesPerStep)

// The same for any stretch of the film, [start, end] ms
export const bakeSpanInSteps = function* <TName extends string>(
  score: Score<TName>,
  [start, end]: readonly [number, number],
  samplesPerStep = Infinity,
): Generator<void, Bake<TName>> {
  const duration = end - start
  const at = duration === 0 ? [start] : sampleTimes(start, end, score.cuts)
  const tracks: Partial<Record<TName, Keyframes>> = {}

  for (const [i, ms] of at.entries()) {
    if (i > 0 && i % samplesPerStep === 0) yield
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

export const bakePart = <TName extends string>(
  score: Score<TName>,
  part: Part,
): Bake<TName> => {
  const steps = bakeInSteps(score, part)
  let step = steps.next()
  while (!step.done) step = steps.next()
  return step.value
}
