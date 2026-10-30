import { useEffect, useRef, useState } from 'react'

import { usePrefersReducedMotion } from './use-prefers-reduced-motion'

const ROLL_MS = 300

// Same curve as --ease-platter in styles.css
const easePlatter = (t: number) => {
  // cubic-bezier(0.65, 0, 0.15, 1), solved for x by bisection
  const bezier = (p1: number, p2: number, s: number) =>
    3 * p1 * s * (1 - s) ** 2 + 3 * p2 * s ** 2 * (1 - s) + s ** 3
  let lo = 0
  let hi = 1
  for (let i = 0; i < 20; i++) {
    const mid = (lo + hi) / 2
    if (bezier(0.65, 0.15, mid) < t) lo = mid
    else hi = mid
  }
  return bezier(0, 1, (lo + hi) / 2)
}

// A count that rolls to each new value; jumps under reduced motion
export const useRollingCount = (value: number): number => {
  const isReducedMotion = usePrefersReducedMotion()
  const [shown, setShown] = useState(value)
  // Where the roll stands, so a new value rolls on from there
  const shownRef = useRef(value)

  useEffect(() => {
    if (isReducedMotion) {
      shownRef.current = value
      return
    }
    const from = shownRef.current
    if (from === value) return
    const start = performance.now()
    let frame = requestAnimationFrame(function step(now) {
      const t = Math.min((now - start) / ROLL_MS, 1)
      const next = Math.round(from + (value - from) * easePlatter(t))
      shownRef.current = next
      setShown(next)
      if (t < 1) frame = requestAnimationFrame(step)
    })
    return () => cancelAnimationFrame(frame)
  }, [value, isReducedMotion])

  return isReducedMotion ? value : shown
}
