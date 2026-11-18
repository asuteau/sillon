import { animate } from 'motion'
import type { AnimationPlaybackControls, AnimationSequence } from 'motion'
import { useCallback, useEffect, useRef, useState } from 'react'

import { useOnScreen } from '#/shared/hooks/use-on-screen'
import { usePageVisible } from '#/shared/hooks/use-page-visible'
import { usePrefersReducedMotion } from '#/shared/hooks/use-prefers-reduced-motion'

import { bakePart } from '../film/film-css.utils'
import type { Bake } from '../film/film-css.utils'
import { msUntilPartEnds, partSpan, playheadAt } from '../film/film.model'
import type { Beats, Part, Playhead, Score } from '../film/film.model'

// Baked once per score and part, on first play: never on the server
const bakes = new WeakMap<Score<string>, Map<Part, Bake<string>>>()
const bakeOf = (score: Score<string>, part: Part) => {
  const parts = bakes.get(score) ?? new Map<Part, Bake<string>>()
  bakes.set(score, parts)
  const bake = parts.get(part) ?? bakePart(score, part)
  parts.set(part, bake)
  return bake
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

// The playhead's part as one Motion sequence, set to the playhead
const playPart = (
  stage: HTMLElement,
  score: Score<string>,
  { part, ms }: Playhead,
): AnimationPlaybackControls | null => {
  const bake = bakeOf(score, part)
  if (bake.duration === 0) return null
  const sequence: AnimationSequence = score.tracks.flatMap((name) => {
    const keyframes = bake.tracks[name]
    const targets = targetsOf(stage, name)
    if (!keyframes || targets.length === 0) return []
    return [
      [
        targets,
        keyframes,
        {
          at: 0,
          duration: bake.duration / 1000,
          times: bake.times,
          ease: 'linear',
        },
      ] as const,
    ]
  })
  if (sequence.length === 0) return null
  const controls = animate(
    sequence,
    part === 'loop' ? { repeat: Infinity } : undefined,
  )
  controls.time = (ms - partSpan(score, part)[0]) / 1000
  return controls
}

// Plays a score on the stage while it's on screen and the tab visible, and
// resumes where it stopped. Tracked elements carry `data-track`; React rests
// them at `at` (render `score.sample(at)`) until Motion takes over, and
// re-renders only on the beats (NO_BEATS for none). With reduced motion,
// the still, for good.
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

  const stageRef = useCallback(
    (node: HTMLElement | null) => {
      observe(node)
      setStage(node)
    },
    [observe],
  )

  useEffect(() => {
    if (reducedMotion) return
    const base = elapsedRef.current
    const startedAt = Date.now()
    const elapsed = () => (isPlaying ? base + Date.now() - startedAt : base)

    const controls = stage
      ? playPart(stage, score, playheadAt(score, base))
      : null
    if (!isPlaying) controls?.pause()

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
      clearTimeout(timer)
      elapsedRef.current = elapsed()
      controls?.cancel()
    }
    // A new part plays its own bake; a new scene only re-renders
  }, [beats, isPlaying, part, reducedMotion, score, stage])

  return {
    stageRef,
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
}
