import { flyCover, takeCoverOrigin } from '#/shared/utils/cover-transition'
import { useCallback, useRef } from 'react'

// Grows the tapped Cover (see setCoverOrigin) into the record screen's cover
// as it mounts, and back on close. Without an origin (Random pick, a Cover
// scrolled away) the sheet simply fades.
export const useCoverTransition = () => {
  const sheetCoverRef = useRef<HTMLElement | null>(null)
  const originRef = useRef<HTMLElement | null>(null)

  // A ref callback, not an Effect: the cover mounts inside a portal, later
  // than the component calling this hook. Runs again when the record changes
  // (keyed cover), which drops the origin: it belonged to the first record.
  const sheetCover = useCallback((node: HTMLElement | null) => {
    sheetCoverRef.current = node
    if (!node) return
    const origin = takeCoverOrigin()
    originRef.current = origin
    if (origin) flyCover({ row: origin, sheet: node, direction: 'open' })
  }, [])

  // Call as the sheet starts closing, while its cover is still laid out
  const flyBack = () => {
    const row = originRef.current
    const sheet = sheetCoverRef.current
    originRef.current = null
    if (row?.isConnected && sheet) flyCover({ row, sheet, direction: 'close' })
  }

  return { sheetCover, flyBack }
}
