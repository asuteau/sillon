import { useState } from 'react'

// Keeps a sheet mounted while its exit animation plays: closing flips local
// `open` first, and `onClose` (which typically unmounts it) runs once the
// animation has finished.
export const useAnimatedClose = (onClose: () => void) => {
  const [open, setOpen] = useState(true)

  const close = () => setOpen(false)

  const onOpenChange = (next: boolean) => {
    if (!next) close()
  }

  const onAnimationEnd = (next: boolean) => {
    if (!next) onClose()
  }

  return { open, close, onOpenChange, onAnimationEnd }
}
