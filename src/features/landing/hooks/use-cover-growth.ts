import { useLayoutEffect, useRef } from 'react'

import { growCover } from '#/shared/utils/cover-transition'

// Grows the grid cover into the detail cover each time the detail opens.
// A layout Effect, so the detail cover never paints in place first.
export const useCoverGrowth = (isOpen: boolean) => {
  const fromRef = useRef<HTMLDivElement>(null)
  const toRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const from = fromRef.current
    const to = toRef.current
    if (!isOpen || !from || !to) return
    const growth = growCover(from, to)
    return () => growth.cancel()
  }, [isOpen])

  return { fromRef, toRef }
}
