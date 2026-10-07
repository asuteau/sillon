import { useEffect, useState } from 'react'

// Whether the element is in the viewport, kept up to date (unlike useInView,
// which only reports the first time). Starts true, for content at the top of
// the page; pass `ref` as a ref callback.
export const useOnScreen = () => {
  const [node, setNode] = useState<Element | null>(null)
  const [isOnScreen, setIsOnScreen] = useState(true)

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
