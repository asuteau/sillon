import { useCallback, useEffect, useRef, useState } from 'react'

import { useOnScreen } from '#/shared/hooks/use-on-screen'
import { usePageVisible } from '#/shared/hooks/use-page-visible'
import { usePrefersReducedMotion } from '#/shared/hooks/use-prefers-reduced-motion'

import {
  bakeSpanInSteps,
  waapiKeyframes,
  withoutHolds,
} from '../film/film-css.utils'
import type { Bake, Keyframes } from '../film/film-css.utils'
import { msUntilPartEnds, partSpan, playheadAt } from '../film/film.model'
import type { Beats, Part, Playhead, Score } from '../film/film.model'

// Ms into a part, [start, end]
type Span = readonly [number, number]

// The first span of an intro, ms
const FIRST_SPAN_MS = 2000

// A part is baked and played in spans, so a long intro starts on its
// opening while the rest bakes as it plays: the first span 2s, each next
// twice as long as the one before, so it is baked well before its turn. A
// loop, or a hold, is one span
export const spansOf = (score: Score<string>, part: Part): Span[] => {
  const [from, to] = partSpan(score, part)
  const length = to - from
  if (part !== 'intro') return [[0, length]]
  const spans: Span[] = []
  let [start, size] = [0, FIRST_SPAN_MS]
  do {
    const end = Math.min(length, start + size)
    spans.push([start, end])
    start = end
    size *= 2
  } while (start < length)
  return spans
}

// A span baked for the browser: each track that moves in it, as Web
// Animations keyframes, holds left out
interface SpanBake {
  // Ms into the part
  start: number
  duration: number
  tracks: Map<string, Keyframe[]>
}

// Baked once per score and span, as it's first played: never on the server
const bakes = new WeakMap<Score<string>, Map<string, SpanBake>>()

// The span baked, then its tracks as keyframes, pausing (yielding) every
// few samples or tracks
const bakeSpan = function* (
  score: Score<string>,
  part: Part,
  span: Span,
): Generator<void, SpanBake> {
  const key = `${part}:${span[0]}`
  const cached = bakes.get(score)?.get(key)
  if (cached) return cached
  const [from] = partSpan(score, part)
  const steps = bakeSpanInSteps(score, [from + span[0], from + span[1]], 4)
  let step = steps.next()
  while (!step.done) {
    yield
    step = steps.next()
  }
  const { duration, times, tracks }: Bake<string> = step.value
  const moving = new Map<string, Keyframe[]>()
  for (const [i, name] of score.tracks.entries()) {
    if (i % 2 === 1) yield
    const keyframes: Keyframes | undefined = tracks[name]
    const track = keyframes && withoutHolds(times, keyframes)
    if (track) moving.set(name, waapiKeyframes(track.times, track.keyframes))
  }
  const bake = { start: span[0], duration, tracks: moving }
  const spans = bakes.get(score) ?? new Map<string, SpanBake>()
  spans.set(key, bake)
  bakes.set(score, spans)
  return bake
}

// How long a slice of work may hold the main thread, ms
const SLICE_MS = 8

// Runs the steps in slices between frames, the first one now, so the page
// never stalls on a long film and what's baked already plays at once.
// Returns a cancel
const runInSlices = (steps: Generator<void, void>) => {
  let timer: ReturnType<typeof setTimeout> | undefined
  const slice = () => {
    const until = performance.now() + SLICE_MS
    let step = steps.next()
    while (!step.done && performance.now() < until) step = steps.next()
    if (!step.done) timer = setTimeout(slice, 0)
  }
  slice()
  return () => clearTimeout(timer)
}

// The elements a track moves: each `[data-track]` of that name, or the
// descendants it names in `data-track-target` (inside a shared component)
const targetsOf = (stage: HTMLElement, name: string) =>
  [...stage.querySelectorAll<HTMLElement>(`[data-track="${name}"]`)].flatMap(
    (node) => {
      const selector = node.dataset.trackTarget
      return selector ? [...node.querySelectorAll(selector)] : [node]
    },
  )

// Plays the playhead's part as Web Animations, one per tracked element and
// span: each span's waits its turn (a delay) and holds its end after it,
// where the next span, made after it, takes over. They share one clock,
// the time into the part. Baked a span at a time: the part starts
// (`onStart`) once the span under the playhead is in, and the rest join as
// they bake. Then the loop bakes ahead, so the intro's end never waits for
// it. The browser plays them: transform and opacity on the compositor,
// nothing per frame on the main thread (ADR 0005)
const playInSteps = function* (
  stage: HTMLElement,
  score: Score<string>,
  { part, ms }: Playhead,
  animations: Animation[],
  onStart: () => void,
): Generator<void, void> {
  const at = ms - partSpan(score, part)[0]
  const spans = spansOf(score, part)
  let startedAt: number | null = null
  // The part's clock: the browser's, once anything plays
  const now = () => {
    const time = animations[0]?.currentTime
    if (typeof time === 'number') return time
    return startedAt === null ? at : at + Date.now() - startedAt
  }
  for (const [s, span] of spans.entries()) {
    const bake = yield* bakeSpan(score, part, span)
    if (bake.duration > 0) {
      for (const [t, [name, keyframes]] of [...bake.tracks].entries()) {
        if (t > 0 && t % 8 === 0) yield
        for (const target of targetsOf(stage, name)) {
          const animation = target.animate(keyframes, {
            duration: bake.duration,
            delay: bake.start,
            iterations: part === 'loop' ? Infinity : 1,
            fill: bake.start === 0 ? 'both' : 'forwards',
          })
          animation.currentTime = now()
          // Held on the playhead until the part starts
          if (startedAt === null) animation.pause()
          animations.push(animation)
        }
      }
    }
    if (startedAt === null && (span[1] > at || s === spans.length - 1)) {
      startedAt = Date.now()
      animations.forEach((a) => a.play())
      onStart()
    }
  }
  if (part === 'intro' && score.ending.kind === 'loop')
    for (const span of spansOf(score, 'loop'))
      yield* bakeSpan(score, 'loop', span)
}

// Plays a score on the stage while it's on screen and the tab visible, and
// resumes where it stopped. Tracked elements carry `data-track`; React rests
// them at `at` (render `score.sample(at)`) until the browser takes over, and
// re-renders only on the beats (NO_BEATS for none). With reduced motion,
// the still, for good. `replay` plays it again from 0.
export const useFilmPlayer = <TName extends string, TScene>(
  score: Score<TName>,
  beats: Beats<TScene>,
): FilmPlayer<TScene> => {
  const reducedMotion = usePrefersReducedMotion()
  const isPageVisible = usePageVisible()
  const { ref: observe, isOnScreen } = useOnScreen()
  const [stage, setStage] = useState<HTMLElement | null>(null)
  const isPlaying = !reducedMotion && isPageVisible && isOnScreen

  const [scene, setScene] = useState(() => beats.at(0))
  const [part, setPart] = useState(() => playheadAt(score, 0).part)
  // Playing time so far, kept across pauses
  const elapsedRef = useRef(0)
  // Each replay plays from 0 again
  const [run, setRun] = useState(0)
  const replayRef = useRef(false)

  const stageRef = useCallback(
    (node: HTMLElement | null) => {
      observe(node)
      setStage(node)
    },
    [observe],
  )

  useEffect(() => {
    if (reducedMotion) return
    const base = replayRef.current ? 0 : elapsedRef.current
    replayRef.current = false
    elapsedRef.current = base
    // Nothing is baked or played while nobody can see it (off-screen, a
    // hidden tab). It picks up where it stopped
    if (stage === null || !isPlaying) return

    // Playing time counts once the part has started
    let startedAt: number | null = null
    const elapsed = () =>
      startedAt === null ? base : base + Date.now() - startedAt

    let timer: ReturnType<typeof setTimeout> | undefined
    const scheduleNextBeat = () => {
      const wait = Math.min(
        beats.next(elapsed()),
        msUntilPartEnds(score, elapsed()),
      )
      if (wait === Infinity) return
      timer = setTimeout(() => {
        setScene(beats.at(elapsed()))
        setPart(playheadAt(score, elapsed()).part)
        scheduleNextBeat()
      }, wait)
    }

    const start = () => {
      startedAt = Date.now()
      scheduleNextBeat()
    }
    const animations: Animation[] = []
    // Without Web Animations (jsdom) only the clock runs
    const cancelSteps =
      'animate' in stage
        ? runInSlices(
            playInSteps(
              stage,
              score,
              playheadAt(score, base),
              animations,
              start,
            ),
          )
        : start()

    return () => {
      cancelSteps?.()
      clearTimeout(timer)
      elapsedRef.current = elapsed()
      animations.forEach((a) => a.cancel())
    }
    // A new part plays its own spans, a replay from 0; a new scene only
    // re-renders
  }, [beats, isPlaying, part, reducedMotion, run, score, stage])

  const replay = useCallback(() => {
    replayRef.current = true
    setScene(beats.at(0))
    setPart(playheadAt(score, 0).part)
    setRun((n) => n + 1)
  }, [beats, score])

  return {
    stageRef,
    hasEnded: !reducedMotion && part !== 'intro',
    replay,
    scene: reducedMotion ? beats.at(score.still) : scene,
    at: reducedMotion ? score.still : partSpan(score, part)[0],
    isPlaying,
  }
}

export interface FilmPlayer<TScene> {
  // The stage, as a ref callback
  stageRef: (node: HTMLElement | null) => void
  scene: TScene
  // The film's time React rests the tracked elements at
  at: number
  isPlaying: boolean
  // Past the intro: in its loop or held on its end
  hasEnded: boolean
  // Plays it again from 0
  replay: () => void
}
