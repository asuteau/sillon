import { useEffect, useEffectEvent, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'

import { toReleaseMatch } from '../scan.model'
import { barcodeMatchesQueryOptions } from '../scan.queries'
import { lookedUp, lookupFailed, scanBarcode } from '../stack.model'
import { getStack, updateStack } from '../stack.store'
import { useScanCamera } from './use-scan-camera'

/** What the viewfinder just saw: a record, or a barcode Discogs doesn't know */
export interface ScanFlash {
  kind: 'hit' | 'not-found'
  /** Changes on every flash, to replay it */
  key: number
}

/** A row the user just scanned again: it lights up to say "got it" */
export interface RowHighlight {
  barcode: string
  key: number
}

const vibrate = (pattern: number | number[]) => {
  if ('vibrate' in navigator) navigator.vibrate(pattern)
}

/** Scans sleeves into the Stack, one after another, and looks each up */
export const useStackScanner = () => {
  const queryClient = useQueryClient()
  const [flash, setFlash] = useState<ScanFlash | null>(null)
  const [highlight, setHighlight] = useState<RowHighlight | null>(null)

  const showNotFound = () => {
    vibrate([60, 60, 60])
    setFlash({ kind: 'not-found', key: Date.now() })
  }

  const showHit = () => {
    vibrate(30)
    setFlash({ kind: 'hit', key: Date.now() })
  }

  /** Signals the outcome once Discogs has answered, so a sleeve gets one
   * signal: a hit, or Not on Discogs. The row shows meanwhile */
  const lookUp = async (barcode: string, { signal = true } = {}) => {
    try {
      const raw = await queryClient.fetchQuery(
        barcodeMatchesQueryOptions(barcode),
      )
      const matches = raw.map(toReleaseMatch)
      updateStack((stack) => lookedUp(stack, barcode, matches))
      if (!signal) return
      if (matches.length === 0) showNotFound()
      else showHit()
    } catch {
      updateStack((stack) => lookupFailed(stack, barcode))
    }
  }

  const handleBarcode = (barcode: string) => {
    const { stack, outcome } = scanBarcode(getStack(), barcode)
    updateStack(() => stack)

    if (outcome === 'not-found') return showNotFound()
    if (outcome === 'repeat') {
      vibrate(30)
      return setHighlight({ barcode, key: Date.now() })
    }
    void lookUp(barcode)
  }

  const { cameraState, videoRef } = useScanCamera(handleBarcode)

  // Records still being looked up when the scanner last closed (or the page
  // reloaded); a lookup still running is shared, not repeated
  const resumeLookups = useEffectEvent(() => {
    for (const record of getStack().records) {
      if (record.status === 'looking-up') {
        void lookUp(record.barcode, { signal: false })
      }
    }
  })
  useEffect(() => resumeLookups(), [])

  return {
    cameraState,
    videoRef,
    flash,
    highlight,
    /** Dev only: a barcode typed in stands for one scanned */
    scanManually: handleBarcode,
  }
}
