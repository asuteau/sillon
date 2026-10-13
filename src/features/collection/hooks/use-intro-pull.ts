import { useEffect, useState } from 'react'

// Once per page load: returning to Home, or closing a record screen, never
// replays it
let hasPulled = false

// The Sleeve pull's one entrance: the centred disc stays in its sleeve until
// the Cover is ready, then slides out. False until then.
export const useIntroPull = (isCoverReady: boolean): boolean => {
  const [isPulled, setPulled] = useState(hasPulled)

  useEffect(() => {
    if (isPulled || !isCoverReady) return
    // A frame with the disc tucked first, so the pull transitions
    const frame = requestAnimationFrame(() => {
      hasPulled = true
      setPulled(true)
    })
    return () => cancelAnimationFrame(frame)
  }, [isPulled, isCoverReady])

  return isPulled
}
