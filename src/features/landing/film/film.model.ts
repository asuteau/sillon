// A landing film as a score (ADR 0005): what every tracked element looks
// like at any moment, as a pure function of time. No DOM, no engine: the
// player bakes it into keyframes and plays them.
//
// Units: time in ms; lengths in stage units (1 = 1% of the stage's width,
// `cqw` in the DOM, so a film scales with its column and never re-bakes on
// resize); angles in degrees; a perspective lens in CSS px.

// cubic-bezier(x1, y1, x2, y2)
export type Curve = readonly [number, number, number, number]

export const CURVES = {
  // --ease-platter
  platter: [0.65, 0, 0.15, 1],
  // --ease-fade
  fade: [0.2, 0, 0, 1],
  // The films' own, no token: a soft landing, and a disc tucking in
  out: [0.16, 1, 0.3, 1],
  inOut: [0.45, 0, 0.1, 1],
  linear: [0, 0, 1, 1],
} as const satisfies Record<string, Curve>

// The curve as an easing of progress 0..1, solved for x as CSS does (Newton,
// then bisection)
export const bezier = ([x1, y1, x2, y2]: Curve) => {
  const cx = 3 * x1
  const bx = 3 * (x2 - x1) - cx
  const ax = 1 - cx - bx
  const cy = 3 * y1
  const by = 3 * (y2 - y1) - cy
  const ay = 1 - cy - by
  const x = (t: number) => ((ax * t + bx) * t + cx) * t
  const dx = (t: number) => (3 * ax * t + 2 * bx) * t + cx
  const y = (t: number) => ((ay * t + by) * t + cy) * t
  return (p: number): number => {
    if (p <= 0) return 0
    if (p >= 1) return 1
    let t = p
    for (let i = 0; i < 8; i++) {
      const d = dx(t)
      if (Math.abs(d) < 1e-6) break
      t -= (x(t) - p) / d
    }
    if (t < 0 || t > 1 || Math.abs(x(t) - p) > 1e-6) {
      let [lo, hi] = [0, 1]
      t = p
      for (let i = 0; i < 40; i++) {
        if (x(t) < p) lo = t
        else hi = t
        t = (lo + hi) / 2
      }
    }
    return y(t)
  }
}

export const mix = (a: number, b: number, t: number) => a + (b - a) * t

// A key: at `at` ms the value is `value`; `ease` curves the step to the next
// key (linear when left out), as a CSS keyframe's easing does
export type Key = readonly [at: number, value: number, ease?: Curve]

// One number over time from its keys, held before the first and after the
// last
export const track = (keys: readonly Key[]) => {
  const eases = keys.map(([, , ease]) => bezier(ease ?? CURVES.linear))
  return (ms: number): number => {
    const next = keys.findIndex(([at]) => at > ms)
    if (next === -1) return keys[keys.length - 1][1]
    if (next === 0) return keys[0][1]
    const [t0, v0] = keys[next - 1]
    const [t1, v1] = keys[next]
    return mix(v0, v1, eases[next - 1]((ms - t0) / (t1 - t0)))
  }
}

// One step of a transform, applied in order (the first is outermost)
export type Move =
  // Lens distance in CSS px
  | { perspective: number }
  // Stage units; z toward the viewer
  | { translate: readonly [x: number, y: number, z?: number] }
  | { rotateX: number }
  | { rotateY: number }
  // In the stage's plane
  | { rotateZ: number }
  | { scale: number }
  // Along one axis, about the element's transform-origin (a bar drawing in)
  | { scaleX: number }
  | { scaleY: number }

// What one tracked element looks like at a moment; anything left out is
// untouched by the film
export interface Look {
  opacity?: number
  transform?: readonly Move[]
  // Lens blur, stage units
  blur?: number
  // How much of a stroke is drawn, 0 to 1
  draw?: number
}

// Each tracked element's look at a moment; one left out is untouched
export type Shot<TName extends string> = Partial<Record<TName, Look>>

// After the last frame: hold on it, or play from `from` to the end again and
// again. The end must look like `from` (a seamless loop); an ambient hold is
// a short loop at the end (a drifting camera, a turning disc).
export type Ending = { kind: 'hold' } | { kind: 'loop'; from: number }

export interface Score<TName extends string> {
  // The tracked elements, by name (`data-track` in the DOM)
  tracks: readonly TName[]
  // One play through, ms
  length: number
  ending: Ending
  // The reduced-motion frame
  still: number
  // Moments the player must hit exactly: a cut, where a look jumps. Between
  // them it samples the curves
  cuts: readonly number[]
  // Every tracked element's look at `ms` into the film. Pure: same time,
  // same shot
  sample: (ms: number) => Shot<TName>
}

// Played once from 0, then the loop over and over; or held on the end
export type Part = 'intro' | 'loop' | 'held'

export interface Playhead {
  part: Part
  // Into the film
  ms: number
}

const loopFrom = (score: Score<string>) =>
  score.ending.kind === 'loop' ? score.ending.from : score.length

// Where the film is after `elapsed` ms of playing
export const playheadAt = (score: Score<string>, elapsed: number): Playhead => {
  const from = loopFrom(score)
  if (elapsed < from) return { part: 'intro', ms: elapsed }
  if (score.ending.kind === 'hold') return { part: 'held', ms: score.length }
  return {
    part: 'loop',
    ms: from + ((elapsed - from) % (score.length - from)),
  }
}

// The film's time a part spans, [start, end]
export const partSpan = (
  score: Score<string>,
  part: Part,
): readonly [number, number] => {
  const from = loopFrom(score)
  if (part === 'intro') return [0, from]
  if (part === 'loop') return [from, score.length]
  return [score.length, score.length]
}

// Playing time until the intro gives way to the loop or the hold
export const msUntilPartEnds = (
  score: Score<string>,
  elapsed: number,
): number => {
  const from = loopFrom(score)
  return elapsed < from ? from - elapsed : Infinity
}

// What React renders changes only at beats (a new record on the strip),
// never per frame. Both read playing time, which counts every loop.
export interface Beats<TScene> {
  at: (elapsed: number) => TScene
  // Playing time to the next change of scene; Infinity for none
  next: (elapsed: number) => number
}

export const NO_BEATS: Beats<undefined> = {
  at: () => undefined,
  next: () => Infinity,
}
