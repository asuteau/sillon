import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'

import { useAddToCollection } from '#/features/collection/collection.mutations'
import { useAddToWantlist } from '#/features/wantlist/wantlist.mutations'
import type { BarcodeResult } from '../search.schema'
import { barcodeSearchQueryOptions } from '../search.queries'

interface BarcodeDetectorResult {
  rawValue: string
}

declare class BarcodeDetector {
  constructor(options?: { formats?: string[] })
  detect(source: HTMLVideoElement): Promise<BarcodeDetectorResult[]>
}

export type ScanState = 'idle' | 'scanning' | 'found' | 'not_found'

export interface UseBarcodeScannerReturn {
  scanState: ScanState
  isSupported: boolean
  barcodeResult: BarcodeResult | null | undefined
  isPending: boolean
  videoRef: React.RefObject<HTMLVideoElement | null>
  addedToCollection: boolean
  addedToWantlist: boolean
  isAskingFulfilledWant: boolean
  isCollectionPending: boolean
  isWantlistPending: boolean
  startCamera: () => Promise<void>
  handleCancel: () => void
  handleScanAgain: () => Promise<void>
  handleAddToCollection: () => Promise<void>
  handleAddToWantlist: () => Promise<void>
  handleFulfilledWantResolved: () => void
  handleManualBarcode: (code: string) => void
}

export const useBarcodeScanner = (
  onClose: () => void,
): UseBarcodeScannerReturn => {
  const [scanState, setScanState] = useState<ScanState>('idle')
  const [detectedBarcode, setDetectedBarcode] = useState('')
  const [addedToCollection, setAddedToCollection] = useState(false)
  const [addedToWantlist, setAddedToWantlist] = useState(false)
  const [isAskingFulfilledWant, setIsAskingFulfilledWant] = useState(false)

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const unmountedRef = useRef(false)

  const isSupported =
    typeof window !== 'undefined' && 'BarcodeDetector' in window

  const { data: barcodeResult, isPending } = useQuery({
    ...barcodeSearchQueryOptions(detectedBarcode),
    enabled: detectedBarcode.length > 0,
  })

  const addToCollection = useAddToCollection()
  const addToWantlist = useAddToWantlist()

  useEffect(() => {
    unmountedRef.current = false
    return () => {
      unmountedRef.current = true
      stopCamera()
    }
  }, [])

  // Skip the explainer screen when the camera was already granted before
  useEffect(() => {
    if (!isSupported) return

    void (async () => {
      try {
        const status = await navigator.permissions.query({
          name: 'camera' as PermissionName,
        })
        if (unmountedRef.current || status.state !== 'granted') return
        await startCamera()
      } catch {
        // Permissions API unavailable (Safari) — keep the explainer screen
      }
    })()
  }, [isSupported])

  // Attach stream to video element after scanning state triggers its mount
  useEffect(() => {
    if (scanState !== 'scanning' || !streamRef.current || !videoRef.current)
      return
    videoRef.current.srcObject = streamRef.current
    videoRef.current.play().catch(() => {})
  }, [scanState])

  useEffect(() => {
    if (scanState !== 'found' || detectedBarcode.length === 0) return
    if (!isPending && barcodeResult === null) setScanState('not_found')
  }, [scanState, detectedBarcode, isPending, barcodeResult])

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
  }

  const startDetection = () => {
    const detector = new BarcodeDetector({
      formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e'],
    })

    const scan = async () => {
      if (videoRef.current?.readyState === HTMLMediaElement.HAVE_ENOUGH_DATA) {
        try {
          const barcodes = await detector.detect(videoRef.current)
          if (barcodes.length > 0) {
            stopCamera()
            setDetectedBarcode(barcodes[0].rawValue)
            setScanState('found')
            return
          }
        } catch {
          // continue polling
        }
      }
      animationFrameRef.current = requestAnimationFrame(scan)
    }

    animationFrameRef.current = requestAnimationFrame(scan)
  }

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      })
      streamRef.current = stream
      setScanState('scanning')
      startDetection()
    } catch {
      // permission denied — stay idle
    }
  }

  const handleCancel = () => {
    stopCamera()
    onClose()
  }

  const handleScanAgain = async () => {
    setDetectedBarcode('')
    setAddedToCollection(false)
    setAddedToWantlist(false)
    setIsAskingFulfilledWant(false)
    await startCamera()
  }

  const handleAddToCollection = async () => {
    if (!barcodeResult) return
    try {
      await addToCollection.mutateAsync(barcodeResult.id)
      setAddedToCollection(true)
      if (barcodeResult.user_data?.in_wantlist) setIsAskingFulfilledWant(true)
      else setTimeout(() => onClose(), 1000)
    } catch {
      // stay on screen
    }
  }

  const handleFulfilledWantResolved = () => onClose()

  const handleManualBarcode = (code: string) => {
    setDetectedBarcode(code)
    setScanState('found')
  }

  const handleAddToWantlist = async () => {
    if (!barcodeResult) return
    try {
      await addToWantlist.mutateAsync(barcodeResult.id)
      setAddedToWantlist(true)
      setTimeout(() => onClose(), 1000)
    } catch {
      // stay on screen
    }
  }

  return {
    scanState,
    isSupported,
    barcodeResult,
    isPending,
    videoRef,
    addedToCollection,
    addedToWantlist,
    isAskingFulfilledWant,
    isCollectionPending: addToCollection.isPending,
    isWantlistPending: addToWantlist.isPending,
    startCamera,
    handleCancel,
    handleScanAgain,
    handleAddToCollection,
    handleAddToWantlist,
    handleFulfilledWantResolved,
    handleManualBarcode,
  }
}
