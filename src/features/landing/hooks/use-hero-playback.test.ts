// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { HERO_STILL } from '../landing.timeline'
import { useHeroPlayback } from './use-hero-playback'

let reducedMotion = false
let intersect: (isIntersecting: boolean) => void = () => {}

const setHidden = (hidden: boolean) => {
  Object.defineProperty(document, 'visibilityState', {
    configurable: true,
    get: () => (hidden ? 'hidden' : 'visible'),
  })
  act(() => {
    document.dispatchEvent(new Event('visibilitychange'))
  })
}

const advance = (ms: number) =>
  act(() => {
    vi.advanceTimersByTime(ms)
  })

const renderPlayback = () => {
  const hook = renderHook(() => useHeroPlayback())
  act(() => {
    hook.result.current.stageRef(document.createElement('div'))
  })
  return hook
}

beforeEach(() => {
  vi.useFakeTimers()
  reducedMotion = false
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: query.includes('reduce') && reducedMotion,
    addEventListener: () => {},
    removeEventListener: () => {},
  }))
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      constructor(callback: IntersectionObserverCallback) {
        intersect = (isIntersecting) =>
          act(() => {
            callback(
              [{ isIntersecting } as IntersectionObserverEntry],
              this as unknown as IntersectionObserver,
            )
          })
      }
      observe() {}
      disconnect() {}
    },
  )
  setHidden(false)
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('useHeroPlayback', () => {
  it('opens on the groove and plays through the beats', () => {
    const { result } = renderPlayback()
    expect(result.current.scene).toEqual({ beat: 'intro', wordmark: false })
    expect(result.current.isPlaying).toBe(true)
    advance(2000)
    expect(result.current.scene.beat).toBe('collection')
    advance(3000)
    expect(result.current.scene.beat).toBe('scan')
  })

  it('pauses while the tab is hidden', () => {
    const { result } = renderPlayback()
    advance(1000)
    setHidden(true)
    expect(result.current.isPlaying).toBe(false)
    advance(10_000)
    expect(result.current.scene.beat).toBe('intro')
    setHidden(false)
    advance(1000)
    expect(result.current.scene.beat).toBe('collection')
  })

  it('pauses while off-screen', () => {
    const { result } = renderPlayback()
    advance(1000)
    intersect(false)
    expect(result.current.isPlaying).toBe(false)
    advance(10_000)
    expect(result.current.scene.beat).toBe('intro')
    intersect(true)
    advance(1000)
    expect(result.current.scene.beat).toBe('collection')
  })

  it('shows a single still frame with reduced motion', () => {
    reducedMotion = true
    const { result } = renderPlayback()
    expect(result.current.scene).toEqual(HERO_STILL)
    expect(result.current.isPlaying).toBe(false)
    advance(20_000)
    expect(result.current.scene).toEqual(HERO_STILL)
  })
})
