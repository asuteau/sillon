import { useCallback, useEffect, useRef, useState } from 'react'

import { useOnScreen } from '#/shared/hooks/use-on-screen'
import { usePageVisible } from '#/shared/hooks/use-page-visible'
import { usePrefersReducedMotion } from '#/shared/hooks/use-prefers-reduced-motion'

import {
  HERO_PART_MS,
  HERO_STILL,
  HERO_TRACKS,
  LOOP_ENTRY_MS,
  heroClockAt,
  heroSceneAt,
  keyframesOf,
  msUntilNextCue,
} from '../landing.timeline'
import type { HeroClock, HeroPart, HeroTrackName } from '../landing.timeline'

// A disc's turn while it's out, slow like a platter spinning down
const SPIN_MS = 1900

const isTrackName = (
  part: HeroPart,
  name: string | undefined,
): name is HeroTrackName => name !== undefined && name in HERO_TRACKS[part]

// One Web Animation per tracked element of the stage (`data-track`), set to
// the clock; discs marked `data-spin` turn. Transform and opacity only, plus
// the groove's draw-in.
const startFilm = (
  stage: HTMLElement,
  { part, ms }: HeroClock,
  elapsed: number,
): Animation[] => {
  if (typeof stage.animate !== 'function') return []
  const length = HERO_PART_MS[part]

  const tracked = [
    ...stage.querySelectorAll<HTMLElement>('[data-track]'),
  ].flatMap((node) => {
    const name = node.dataset.track
    if (!isTrackName(part, name)) return []
    const target =
      name === 'grooveDraw' ? (node.querySelector('path') ?? node) : node
    const animation = target.animate(
      keyframesOf(HERO_TRACKS[part][name], length),
      {
        duration: length,
        iterations: part === 'loop' ? Infinity : 1,
        fill: 'both',
      },
    )
    animation.currentTime = ms
    return [animation]
  })

  const spins = [...stage.querySelectorAll('[data-spin] .disc-grooves')].map(
    (grooves) => {
      const animation = grooves.animate(
        [{ transform: 'rotate(0deg)' }, { transform: 'rotate(360deg)' }],
        { duration: SPIN_MS, iterations: Infinity },
      )
      animation.currentTime = elapsed % SPIN_MS
      return animation
    },
  )

  return [...tracked, ...spins]
}

// Where the film rests before its Web Animations take over, or for good
// with reduced motion
const restingClock = (part: HeroPart): HeroClock =>
  part === 'opening' ? { part, ms: 0 } : { part, ms: LOOP_ENTRY_MS }

// Plays the hero film while the stage is on screen and the tab visible;
// resumes where it paused. With reduced motion, a single still frame.
export const useHeroPlayback = () => {
  const reducedMotion = usePrefersReducedMotion()
  const isPageVisible = usePageVisible()
  const { ref: observe, isOnScreen } = useOnScreen()
  const [stage, setStage] = useState<HTMLElement | null>(null)
  const isPlaying = !reducedMotion && isPageVisible && isOnScreen

  const [scene, setScene] = useState(() => heroSceneAt(0))
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

    const animations = stage ? startFilm(stage, heroClockAt(base), base) : []
    if (!isPlaying) for (const animation of animations) animation.pause()

    let timer: ReturnType<typeof setTimeout> | undefined
    const scheduleNextCue = () => {
      timer = setTimeout(() => {
        setScene(heroSceneAt(elapsed()))
        scheduleNextCue()
      }, msUntilNextCue(elapsed()))
    }
    if (isPlaying) scheduleNextCue()

    return () => {
      clearTimeout(timer)
      elapsedRef.current = elapsed()
      for (const animation of animations) animation.cancel()
    }
    // A new part needs its own tracks; a new pass only new records
  }, [isPlaying, reducedMotion, scene.part, stage])

  return {
    stageRef,
    scene,
    clock: reducedMotion ? HERO_STILL : restingClock(scene.part),
    isPlaying,
  }
}
