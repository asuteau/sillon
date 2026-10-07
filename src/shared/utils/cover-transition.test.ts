// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  COVER_OPEN_MS,
  PLATTER_EASING,
  flipTransform,
  growCover,
  setCoverOrigin,
  takeCoverOrigin,
} from './cover-transition'

const rect = (left: number, top: number, width: number, height = width) => ({
  left,
  top,
  width,
  height,
})

describe('flipTransform', () => {
  it('maps the large rect onto the small one', () => {
    expect(flipTransform(rect(300, 400, 48), rect(100, 200, 240))).toBe(
      'translate(200px, 200px) scale(0.2, 0.2)',
    )
  })

  it('is the identity for the same rect', () => {
    expect(flipTransform(rect(10, 20, 30), rect(10, 20, 30))).toBe(
      'translate(0px, 0px) scale(1, 1)',
    )
  })
})

describe('cover origin', () => {
  afterEach(() => {
    vi.useRealTimers()
    document.body.innerHTML = ''
  })

  const cover = () => document.body.appendChild(document.createElement('div'))

  it('is handed over once', () => {
    const el = cover()
    setCoverOrigin(el)

    expect(takeCoverOrigin()).toBe(el)
    expect(takeCoverOrigin()).toBeNull()
  })

  it('expires when no sheet takes it promptly', () => {
    vi.useFakeTimers()
    setCoverOrigin(cover())
    vi.advanceTimersByTime(2000)

    expect(takeCoverOrigin()).toBeNull()
  })

  it('is dropped once it leaves the page', () => {
    const el = cover()
    setCoverOrigin(el)
    el.remove()

    expect(takeCoverOrigin()).toBeNull()
  })
})

describe('growCover', () => {
  it('grows the detail cover from the grid cover in 320ms, platter easing', () => {
    const from = document.createElement('div')
    const to = document.createElement('div')
    from.getBoundingClientRect = () => new DOMRect(20, 40, 60, 60)
    to.getBoundingClientRect = () => new DOMRect(40, 20, 240, 240)
    const animate = vi.fn()
    to.animate = animate

    growCover(from, to)

    expect(to.style.transformOrigin).toBe('0 0')
    expect(animate).toHaveBeenCalledWith(
      [
        { transform: 'translate(-20px, 20px) scale(0.25, 0.25)' },
        { transform: 'none' },
      ],
      { duration: COVER_OPEN_MS, easing: PLATTER_EASING },
    )
    expect(COVER_OPEN_MS).toBe(320)
  })
})
