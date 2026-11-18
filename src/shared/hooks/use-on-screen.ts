import { useCallback, useEffect, useState } from 'react'

const inViewport = (node: Element) => {
  const { top, bottom, left, right } = node.getBoundingClientRect()
  return (
    bottom > 0 &&
    right > 0 &&
    top < window.innerHeight &&
    left < window.innerWidth
  )
}

// Whether the element is in the viewport, kept up to date (unlike useInView,
// which only reports the first time). Measured as it mounts, so what's on
// screen on load knows it at once, not a frame later with the observer's
// first report; pass `ref` as a ref callback.
export const useOnScreen = () => {
  const [node, setNode] = useState<Element | null>(null)
  const [isOnScreen, setIsOnScreen] = useState(false)

  const ref = useCallback((element: Element | null) => {
    setNode(element)
    if (element) setIsOnScreen(inViewport(element))
  }, [])

  useEffect(() => {
    if (!node) return
    const observer = new IntersectionObserver(([entry]) =>
      setIsOnScreen(entry.isIntersecting),
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [node])

  return { ref, isOnScreen }
}
