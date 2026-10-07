import { useEffect, useState } from 'react'

// Preloads the HD Cover so it only fades in once fully decoded
export const useHdCover = (hdSrc: string | null) => {
  const [hdUrl, setHdUrl] = useState<string | null>(null)
  const [hdVisible, setHdVisible] = useState(false)
  const [hdFailed, setHdFailed] = useState(false)

  useEffect(() => {
    setHdUrl(null)
    setHdVisible(false)
    setHdFailed(false)
    if (!hdSrc) return
    let frame = 0
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      setHdUrl(hdSrc)
      frame = requestAnimationFrame(
        () => (frame = requestAnimationFrame(() => setHdVisible(true))),
      )
    }
    img.onerror = () => setHdFailed(true)
    img.src = hdSrc
    return () => {
      img.onload = null
      img.onerror = null
      cancelAnimationFrame(frame)
    }
  }, [hdSrc])

  return { hdUrl, hdVisible, hdFailed }
}
