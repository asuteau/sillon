import { useCallback, useEffect, useRef, useState } from 'react'

import { useOnScreen } from '#/shared/hooks/use-on-screen'
import { usePageVisible } from '#/shared/hooks/use-page-visible'
import { usePrefersReducedMotion } from '#/shared/hooks/use-prefers-reduced-motion'

import {
  bakeInSteps,
  waapiKeyframes,
  withoutHolds,
} from '../film/film-css.utils'
import type { Bake, Keyframes } from '../film/film-css.utils'
import { msUntilPartEnds, partSpan, playheadAt } from '../film/film.model'
import type { Beats, Part, Playhead, Score } from '../film/film.model'

// A part baked for the browser: each track that moves, as Web Animations
// keyframes, holds left out
interface PartBake {
  duration: number
  tracks: Map<string, Keyframe[]>
}

// The bake, then its tracks as keyframes, pausing (yielding) every few
// samples or tracks
const bakeForBrowser = function* (
  score: Score<string>,
  part: Part,
): Generator<void, PartBake> {
  const steps = bakeInSteps(score, part, 4)
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
  return { duration, tracks: moving }
}

// Baked once per score and part, on first play: never on the server
const bakes = new WeakMap<Score<string>, Map<Part, PartBake>>()
const bakedOf = (score: Score<string>, part: Part) =>
  bakes.get(score)?.get(part)

// How long a slice of baking may hold the main thread, ms
const BAKE_SLICE_MS = 8

// Bakes a part in slices between frames, so the page never stalls on a
// long film; `done` once it's ready. Returns a cancel
const bakeSoon = (score: Score<string>, part: Part, done: () => void) => {
  const steps = bakeForBrowser(score, part)
  let timer: ReturnType<typeof setTimeout> | undefined
  const slice = () => {
    const until = performance.now() + BAKE_SLICE_MS
    let step = steps.next()
    while (!step.done && performance.now() < until) step = steps.next()
    if (!step.done) {
      timer = setTimeout(slice, 0)
      return
    }
    const parts = bakes.get(score) ?? new Map<Part, PartBake>()
    parts.set(part, step.value)
    bakes.set(score, parts)
    done()
  }
  timer = setTimeout(slice, 0)
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

// The part's animations, played and paused, set and stopped together
interface PartControls {
  pause: () => void
  cancel: () => void
}

// The playhead's part as Web Animations, one per tracked element, set to
// the playhead. The browser plays them: transform and opacity on the
// compositor, nothing per frame on the main thread (ADR 0005)
const playPart = (
  stage: HTMLElement,
  bake: PartBake,
  score: Score<string>,
  { part, ms }: Playhead,
): PartControls | null => {
  if (bake.duration === 0) return null
  const at = ms - partSpan(score, part)[0]
  const animations = [...bake.tracks].flatMap(([name, keyframes]) =>
    targetsOf(stage, name).map((target) => {
      const animation = target.animate(keyframes, {
        duration: bake.duration,
        iterations: part === 'loop' ? Infinity : 1,
        fill: 'both',
      })
      animation.currentTime = at
      return animation
    }),
  )
  if (animations.length === 0) return null
  return {
    pause: () => animations.forEach((a) => a.pause()),
    cancel: () => animations.forEach((a) => a.cancel()),
  }
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
  // Bumped once a part is baked, to play it
  const [baked, setBaked] = useState(0)

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
    const playhead = playheadAt(score, base)
    // Nothing is baked or played while nobody can see it (off-screen, a
    // hidden tab), nor without Web Animations (jsdom). It picks up where it
    // stopped
    const canPlay = stage !== null && isPlaying && 'animate' in stage
    const bake = bakedOf(score, playhead.part)
    // Baked first, a slice at a time; it rests where it is until then
    if (canPlay && !bake) {
      elapsedRef.current = base
      return bakeSoon(score, playhead.part, () => setBaked((n) => n + 1))
    }

    const controls =
      canPlay && bake ? playPart(stage, bake, score, playhead) : null
    const startedAt = Date.now()
    const elapsed = () => (isPlaying ? base + Date.now() - startedAt : base)

    // The loop baked ahead, so the intro's end never waits for it
    const cancelAhead =
      canPlay &&
      playhead.part === 'intro' &&
      score.ending.kind === 'loop' &&
      !bakedOf(score, 'loop')
        ? bakeSoon(score, 'loop', () => {})
        : undefined

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
    if (isPlaying) scheduleNextBeat()

    return () => {
      cancelAhead?.()
      clearTimeout(timer)
      elapsedRef.current = elapsed()
      controls?.cancel()
    }
    // A new part plays its own bake, a replay from 0, a finished bake its
    // part; a new scene only re-renders
  }, [baked, beats, isPlaying, part, reducedMotion, run, score, stage])

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
