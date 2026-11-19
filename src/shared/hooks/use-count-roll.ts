import { useEffect, useRef, useState } from 'react'

import { countDigits } from '#/shared/utils/count-digits'
import type { CountDigit } from '#/shared/utils/count-digits'

import { usePrefersReducedMotion } from './use-prefers-reduced-motion'

const ROLL_MS = 300
const FADE_MS = 160
// Same curves as --ease-platter / --ease-fade in styles.css
const EASE_PLATTER = 'cubic-bezier(0.65, 0, 0.15, 1)'
const EASE_FADE = 'cubic-bezier(0.2, 0, 0, 1)'

interface Roll {
  from: number
  to: number
}

interface CountRoll {
  // Nothing to show: no count, or a zero that has finished fading out
  isHidden: boolean
  columns: CountDigit[]
  rootRef: React.RefObject<HTMLSpanElement | null>
}

const settle = (animations: Animation[], onDone: () => void) => {
  void Promise.all(animations.map((a) => a.finished)).then(onDone, () => {})
}

// A count's odometer: changed digits slide (up on add, down on remove), and
// the badge fades between 0 and 1. Nothing plays on first show or when
// `animated` is off, and under reduced motion every change is instant.
export const useCountRoll = (
  count: number | undefined,
  animated: boolean,
): CountRoll => {
  const isReducedMotion = usePrefersReducedMotion()
  const isPlaying = animated && !isReducedMotion
  const rootRef = useRef<HTMLSpanElement>(null)

  const [previous, setPrevious] = useState(count)
  const [roll, setRoll] = useState<Roll | null>(null)
  // The last real count, kept on screen while a zero fades out
  const [held, setHeld] = useState(count)
  const [isLeaving, setIsLeaving] = useState(false)

  if (count !== previous) {
    setPrevious(count)
    const was = previous
    if (count) setHeld(count)
    setIsLeaving(isPlaying && !!was && !count)
    setRoll(isPlaying && was && count ? { from: was, to: count } : null)
  }

  // Digits slide
  useEffect(() => {
    const root = rootRef.current
    if (!roll || !root) return
    const direction = roll.to > roll.from ? 1 : -1
    const animations = [
      ...root.querySelectorAll<HTMLElement>('[data-roll="in"]'),
    ].map((el) =>
      el.animate(
        [
          { transform: `translateY(${direction * 100}%)`, opacity: 0 },
          { transform: 'translateY(0)', opacity: 1 },
        ],
        { duration: ROLL_MS, easing: EASE_PLATTER },
      ),
    )
    animations.push(
      ...[...root.querySelectorAll<HTMLElement>('[data-roll="out"]')].map(
        (el) =>
          el.animate(
            [
              { transform: 'translateY(0)', opacity: 1 },
              { transform: `translateY(${-direction * 100}%)`, opacity: 0 },
            ],
            { duration: ROLL_MS, easing: EASE_PLATTER, fill: 'forwards' },
          ),
      ),
    )
    settle(animations, () => setRoll(null))
    return () => animations.forEach((a) => a.cancel())
  }, [roll])

  // 1 → 0: fade out, then unmount
  useEffect(() => {
    const root = rootRef.current
    if (!isLeaving || !root) return
    const fade = root.animate([{ opacity: 1 }, { opacity: 0 }], {
      duration: FADE_MS,
      easing: EASE_FADE,
      fill: 'forwards',
    })
    settle([fade], () => setIsLeaving(false))
    return () => fade.cancel()
  }, [isLeaving])

  // 0 → 1: fade in
  const wasZero = useRef(count === 0)
  useEffect(() => {
    const root = rootRef.current
    if (isPlaying && wasZero.current && count && root) {
      root.animate([{ opacity: 0 }, { opacity: 1 }], {
        duration: FADE_MS,
        easing: EASE_FADE,
      })
    }
    wasZero.current = count === 0
  }, [count, isPlaying])

  const shown = count || (isLeaving ? held : undefined)
  const columns = shown
    ? roll
      ? countDigits(roll.from, roll.to)
      : countDigits(shown, shown)
    : []
  return { isHidden: !shown, columns, rootRef }
}
