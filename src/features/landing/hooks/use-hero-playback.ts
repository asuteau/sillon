import { useEffect, useRef, useState } from 'react'

import { useOnScreen } from '#/shared/hooks/use-on-screen'
import { usePageVisible } from '#/shared/hooks/use-page-visible'
import { usePrefersReducedMotion } from '#/shared/hooks/use-prefers-reduced-motion'

import { HERO_STILL, heroSceneAt, msUntilNextCue } from '../landing.timeline'

// Plays the hero timeline while the stage is on screen and the tab visible;
// resumes where it paused. With reduced motion, a single still frame.
export const useHeroPlayback = () => {
  const reducedMotion = usePrefersReducedMotion()
  const isPageVisible = usePageVisible()
  const { ref: stageRef, isOnScreen } = useOnScreen()
  const isPlaying = !reducedMotion && isPageVisible && isOnScreen

  const [scene, setScene] = useState(() => heroSceneAt(0))
  // Playing time so far, kept across pauses
  const elapsedRef = useRef(0)

  useEffect(() => {
    if (!isPlaying) return
    const base = elapsedRef.current
    const startedAt = Date.now()
    const elapsed = () => base + Date.now() - startedAt

    let timer: ReturnType<typeof setTimeout>
    const scheduleNextCue = () => {
      timer = setTimeout(() => {
        setScene(heroSceneAt(elapsed()))
        scheduleNextCue()
      }, msUntilNextCue(elapsed()))
    }
    scheduleNextCue()

    return () => {
      clearTimeout(timer)
      elapsedRef.current = elapsed()
    }
  }, [isPlaying])

  return {
    stageRef,
    scene: reducedMotion ? HERO_STILL : scene,
    isPlaying,
  }
}
