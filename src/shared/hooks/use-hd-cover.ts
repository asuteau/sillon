import { isCoverDecoded } from '#/shared/utils/cover-preload'
import { useEffect, useState } from 'react'

// Preloads the HD Cover so it only fades in once fully decoded. One already
// decoded (see preloadCover) shows at once.
export const useHdCover = (hdSrc: string | null) => {
  const [hdUrl, setHdUrl] = useState<string | null>(null)
  const [hdVisible, setHdVisible] = useState(false)
  const [hdFailed, setHdFailed] = useState(false)
  const isDecoded = !!hdSrc && isCoverDecoded(hdSrc)

  useEffect(() => {
    setHdUrl(null)
    setHdVisible(false)
    setHdFailed(false)
    if (!hdSrc || isDecoded) return
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
  }, [hdSrc, isDecoded])

  if (isDecoded) return { hdUrl: hdSrc, hdVisible: true, hdFailed: false }
  return { hdUrl, hdVisible, hdFailed }
}
