import { useEffect, useRef, useState } from 'react'

// vaul's exit transition (TRANSITIONS.DURATION, not exported)
const EXIT_DURATION_MS = 500

// Keeps a sheet mounted while its exit animation plays: closing flips local
// `open` first, and `onClose` (which typically unmounts it) runs once the
// animation has finished.
export const useAnimatedClose = (onClose: () => void) => {
  const [open, setOpen] = useState(true)
  const hasClosedRef = useRef(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => () => clearTimeout(timeoutRef.current), [])

  const finishClose = () => {
    if (hasClosedRef.current) return
    hasClosedRef.current = true
    clearTimeout(timeoutRef.current)
    onClose()
  }

  // vaul only reports animation end for closes it initiates (swipe, overlay),
  // not when `open` is flipped from outside — so schedule it ourselves
  const close = () => {
    setOpen(false)
    clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(finishClose, EXIT_DURATION_MS)
  }

  const onOpenChange = (next: boolean) => {
    if (!next) close()
  }

  const onAnimationEnd = (next: boolean) => {
    if (!next) finishClose()
  }

  return { open, close, onOpenChange, onAnimationEnd }
}
