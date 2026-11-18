import { useEffect, useState } from 'react'

// Whether the element is in the viewport, kept up to date (unlike useInView,
// which only reports the first time). Starts false until the observer's
// first report, which comes with the next frame; pass `ref` as a ref
// callback.
export const useOnScreen = () => {
  const [node, setNode] = useState<Element | null>(null)
  const [isOnScreen, setIsOnScreen] = useState(false)

  useEffect(() => {
    if (!node) return
    const observer = new IntersectionObserver(([entry]) =>
      setIsOnScreen(entry.isIntersecting),
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [node])

  return { ref: setNode, isOnScreen }
}
