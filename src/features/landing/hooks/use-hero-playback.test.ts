// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useHeroPlayback } from './use-hero-playback'

let reducedMotion = false
let intersect: (isIntersecting: boolean) => void = () => {}

interface FakeAnimation {
  target: Element
  currentTime: number
  playState: 'running' | 'paused' | 'idle'
  options: KeyframeAnimationOptions
}

// jsdom has no Web Animations: record what the film asks for
let animations: FakeAnimation[] = []
const live = () => animations.filter((a) => a.playState !== 'idle')
const worldAnimation = () =>
  live().find((a) => (a.target as HTMLElement).dataset.track === 'world')

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

const stage = () => {
  const node = document.createElement('div')
  node.innerHTML = '<div data-track="world"></div><div data-track="pick"></div>'
  return node
}

const renderPlayback = () => {
  const hook = renderHook(() => useHeroPlayback())
  act(() => {
    hook.result.current.stageRef(stage())
  })
  return hook
}

beforeEach(() => {
  vi.useFakeTimers()
  reducedMotion = false
  animations = []
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
  Element.prototype.animate = function (
    this: Element,
    _keyframes: Keyframe[] | PropertyIndexedKeyframes | null,
    options?: number | KeyframeAnimationOptions,
  ) {
    const animation: FakeAnimation = {
      target: this,
      currentTime: 0,
      playState: 'running',
      options: typeof options === 'object' ? options : {},
    }
    animations.push(animation)
    return Object.assign(animation, {
      play: () => (animation.playState = 'running'),
      pause: () => (animation.playState = 'paused'),
      cancel: () => (animation.playState = 'idle'),
    }) as unknown as Animation
  }
  setHidden(false)
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
  // @ts-expect-error jsdom has none of its own
  delete Element.prototype.animate
})

describe('useHeroPlayback', () => {
  it('plays the opening once, then loops pass after pass', () => {
    const { result } = renderPlayback()
    expect(result.current.scene).toEqual({
      part: 'opening',
      pass: 0,
      screen: 1,
    })
    expect(result.current.isPlaying).toBe(true)
    advance(6600)
    expect(result.current.scene.part).toBe('loop')
    advance(5800)
    expect(result.current.scene.pass).toBe(1)
  })

  it('runs each element on its track, the loop repeating', () => {
    renderPlayback()
    expect(worldAnimation()?.playState).toBe('running')
    expect(worldAnimation()?.options.iterations).toBe(1)
    advance(6600)
    expect(worldAnimation()?.options.iterations).toBe(Infinity)
    // Joins the loop on the strip
    expect(worldAnimation()?.currentTime).toBe(1800)
  })

  it('pauses while the tab is hidden, and resumes where it left off', () => {
    const { result } = renderPlayback()
    advance(1000)
    setHidden(true)
    expect(result.current.isPlaying).toBe(false)
    expect(worldAnimation()?.playState).toBe('paused')
    expect(worldAnimation()?.currentTime).toBe(1000)
    advance(10_000)
    expect(result.current.scene.part).toBe('opening')
    setHidden(false)
    expect(worldAnimation()?.playState).toBe('running')
    expect(worldAnimation()?.currentTime).toBe(1000)
    advance(5600)
    expect(result.current.scene.part).toBe('loop')
  })

  it('pauses while off-screen', () => {
    const { result } = renderPlayback()
    advance(1000)
    intersect(false)
    expect(result.current.isPlaying).toBe(false)
    expect(worldAnimation()?.playState).toBe('paused')
    advance(10_000)
    expect(result.current.scene.part).toBe('opening')
    intersect(true)
    advance(5600)
    expect(result.current.scene.part).toBe('loop')
  })

  it('holds one still frame, nothing moving, with reduced motion', () => {
    reducedMotion = true
    const { result } = renderPlayback()
    expect(result.current.isPlaying).toBe(false)
    expect(result.current.clock).toEqual({ part: 'opening', ms: 5000 })
    advance(20_000)
    expect(result.current.scene.part).toBe('opening')
    expect(live()).toHaveLength(0)
  })
})
