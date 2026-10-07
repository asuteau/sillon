// Signature 1 — cover → detail: the tapped Cover grows into the record
// screen's cover, and shrinks back to its row on close. A copy of the Cover
// flies above the sheet (Web Animations, no layout work) while the sheet
// itself only fades, so the sheet keeps its own layout and focus handling.

const COVER_OPEN_MS = 320
const COVER_CLOSE_MS = 280
const PLATTER_EASING = 'cubic-bezier(.65,0,.15,1)'
// Above dialogs and drawers (z-50)
const FLYING_COVER_Z_INDEX = '60'

// A tap opens its sheet within a frame or two; anything older is stale
const ORIGIN_TTL_MS = 1000

interface Rect {
  left: number
  top: number
  width: number
  height: number
}

// Transform that lays an element sitting on `to` over `from`
export const flipTransform = (from: Rect, to: Rect): string =>
  `translate(${from.left - to.left}px, ${from.top - to.top}px) scale(${from.width / to.width}, ${from.height / to.height})`

let origin: { cover: HTMLElement; at: number } | null = null

// Called on tap, before the record screen mounts
export const setCoverOrigin = (cover: HTMLElement | null) => {
  origin = cover ? { cover, at: Date.now() } : null
}

// The Cover the record screen was opened from, at most once
export const takeCoverOrigin = (): HTMLElement | null => {
  const taken = origin
  origin = null
  if (!taken) return null
  if (Date.now() - taken.at > ORIGIN_TTL_MS) return null
  if (!taken.cover.isConnected) return null
  return taken.cover
}

const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

const isOnScreen = (r: Rect) =>
  r.width > 0 &&
  r.height > 0 &&
  r.top + r.height > 0 &&
  r.top < window.innerHeight &&
  r.left + r.width > 0 &&
  r.left < window.innerWidth

interface FlyCoverInput {
  // The Cover in the list
  row: HTMLElement
  // The record screen's Cover
  sheet: HTMLElement
  direction: 'open' | 'close'
}

// The copy always sits on the sheet's (larger) rect, so the image is drawn at
// full size and only scaled down. Reduced motion: no flight, the sheet fades.
export const flyCover = ({ row, sheet, direction }: FlyCoverInput) => {
  if (prefersReducedMotion()) return

  const rowRect = row.getBoundingClientRect()
  const sheetRect = sheet.getBoundingClientRect()
  if (!isOnScreen(rowRect) || !isOnScreen(sheetRect)) return

  const isOpening = direction === 'open'
  // Open: copy the loaded row Cover; close: copy the sheet's, maybe HD
  const copy = (isOpening ? row : sheet).cloneNode(true)
  if (!(copy instanceof HTMLElement)) return
  // Closing mid-open: the sheet cover is still hidden under the open flight
  copy.style.visibility = ''

  Object.assign(copy.style, {
    position: 'fixed',
    left: `${sheetRect.left}px`,
    top: `${sheetRect.top}px`,
    width: `${sheetRect.width}px`,
    height: `${sheetRect.height}px`,
    margin: '0',
    zIndex: FLYING_COVER_Z_INDEX,
    pointerEvents: 'none',
    transformOrigin: '0 0',
  })
  copy.setAttribute('aria-hidden', 'true')
  document.body.append(copy)

  const hidden = isOpening ? [row, sheet] : [row]
  for (const el of hidden) el.style.visibility = 'hidden'

  const atRow = { transform: flipTransform(rowRect, sheetRect) }
  const atSheet = { transform: 'none' }
  const flight = copy.animate(isOpening ? [atRow, atSheet] : [atSheet, atRow], {
    duration: isOpening ? COVER_OPEN_MS : COVER_CLOSE_MS,
    easing: PLATTER_EASING,
  })

  const land = () => {
    copy.remove()
    for (const el of hidden) el.style.visibility = ''
  }
  flight.finished.then(land, land)
}
