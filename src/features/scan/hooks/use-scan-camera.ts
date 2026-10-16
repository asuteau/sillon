import { useEffect, useEffectEvent, useRef, useState } from 'react'

import { canScanBarcodes, createBarcodeReader } from '../barcode-reader'

/** `no-reader`: the camera works, but the barcode reader couldn't load */
export type CameraState =
  'unsupported' | 'starting' | 'live' | 'blocked' | 'no-reader'

// A sleeve held in frame is read many times a second: it is one sighting
// until it has been out of sight this long
const SIGHTING_GAP_MS = 1500

/** The back camera, reading barcodes until the scanner closes. Each sleeve
 * shown is reported once per sighting */
export const useScanCamera = (onBarcode: (barcode: string) => void) => {
  const [isSupported] = useState(canScanBarcodes)
  const [cameraState, setCameraState] = useState<CameraState>(
    isSupported ? 'starting' : 'unsupported',
  )
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const reportBarcode = useEffectEvent(onBarcode)

  useEffect(() => {
    if (!isSupported) return

    let stopped = false
    // Read through a call: the scanner can close during any await
    const isStopped = () => stopped
    let stream: MediaStream | null = null
    let frame: number | null = null
    let lastSighting = { barcode: '', at: 0 }

    const start = async () => {
      try {
        // Straight onto the viewfinder: the browser asks for the camera over
        // it the first time, and nothing is asked once it was allowed
        const granted = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        })
        if (isStopped()) {
          granted.getTracks().forEach((t) => t.stop())
          return
        }
        stream = granted
        // The video is mounted from the start, behind the viewfinder shell
        if (videoRef.current) {
          videoRef.current.srcObject = granted
          void videoRef.current.play().catch(() => {})
        }
        setCameraState('live')
      } catch {
        if (!isStopped()) setCameraState('blocked')
        return
      }

      let reader: Awaited<ReturnType<typeof createBarcodeReader>>
      try {
        reader = await createBarcodeReader()
      } catch {
        // Offline before the WASM reader was ever fetched, most likely
        stream.getTracks().forEach((t) => t.stop())
        if (!isStopped()) setCameraState('no-reader')
        return
      }

      const read = async () => {
        const video = videoRef.current
        if (isStopped()) return
        if (video?.readyState === HTMLMediaElement.HAVE_ENOUGH_DATA) {
          try {
            const barcode = (await reader.detect(video)).at(0)
            const now = Date.now()
            if (barcode && !isStopped()) {
              const isSameSighting =
                barcode.rawValue === lastSighting.barcode &&
                now - lastSighting.at < SIGHTING_GAP_MS
              lastSighting = { barcode: barcode.rawValue, at: now }
              if (!isSameSighting) reportBarcode(barcode.rawValue)
            }
          } catch {
            // A frame that can't be read: try the next one
          }
        }
        if (!isStopped()) frame = requestAnimationFrame(() => void read())
      }
      frame = requestAnimationFrame(() => void read())
    }

    void start()

    return () => {
      stopped = true
      stream?.getTracks().forEach((t) => t.stop())
      if (frame !== null) cancelAnimationFrame(frame)
    }
  }, [isSupported])

  return { cameraState, videoRef }
}
