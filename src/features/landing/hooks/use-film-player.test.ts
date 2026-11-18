// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { Beats, Score } from '../film/film.model'
import { useFilmPlayer } from './use-film-player'

interface FakeAnimation {
  target: Element
  options: KeyframeAnimationOptions
  currentTime: number
  playState: 'running' | 'paused' | 'idle'
}

// The engine at its boundary: record what the player asks the browser to
// play (jsdom has no Web Animations)
let played: FakeAnimation[] = []
// A function, not an arrow: the element is `this`
const fakeAnimate = function (
  this: Element,
  _keyframes: Keyframe[],
  options: KeyframeAnimationOptions,
) {
  const animation: FakeAnimation = {
    target: this,
    options,
    currentTime: 0,
    playState: 'running',
  }
  played.push(animation)
  return Object.assign(animation, {
    pause: () => (animation.playState = 'paused'),
    cancel: () => (animation.playState = 'idle'),
  })
}
const live = () => played.filter((a) => a.playState !== 'idle')
// What plays now: one animation per moving element, all at one time
const current = () => {
  const animations = live()
  expect(animations.length).toBeGreaterThan(0)
  const [first] = animations
  for (const a of animations) {
    expect(a.currentTime).toBe(first.currentTime)
    expect(a.playState).toBe(first.playState)
    expect(a.options.iterations).toBe(first.options.iterations)
  }
  return {
    targets: animations.map((a) => a.target),
    loops: first.options.iterations === Infinity,
    time: first.currentTime / 1000,
    state: first.playState,
  }
}

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

// 10s: an intro to 6s, then 6–10s looping; a still at 9s
const FILM: Score<'world' | 'pick'> = {
  tracks: ['world', 'pick'],
  length: 10_000,
  ending: { kind: 'loop', from: 6000 },
  still: 9000,
  cuts: [],
  sample: (ms) => ({
    world: { opacity: ms / 10_000 },
    pick: { transform: [{ scale: 1 + ms / 10_000 }] },
  }),
}

// A new scene every 4s of playing
const EVERY_4S: Beats<number> = {
  at: (elapsed) => Math.floor(elapsed / 4000),
  next: (elapsed) => 4000 - (elapsed % 4000),
}

const stage = () => {
  const node = document.createElement('div')
  node.innerHTML =
    '<div data-track="world"></div><div data-track="pick" data-track-target="i"><i></i><i></i></div>'
  return node
}

const renderPlayer = () => {
  const hook = renderHook(() => useFilmPlayer(FILM, EVERY_4S))
  act(() => {
    hook.result.current.stageRef(stage())
  })
  // The observer's first report: on screen; then the bake, between frames
  intersect(true)
  advance(0)
  return hook
}

beforeEach(() => {
  vi.useFakeTimers()
  Object.defineProperty(Element.prototype, 'animate', {
    configurable: true,
    value: fakeAnimate,
  })
  reducedMotion = false
  played = []
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: query.includes('reduce') && reducedMotion,
    addEventListener: () => {},
    removeEventListener: () => {},
  }))
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      // Only what useOnScreen reads of an entry
      constructor(callback: (entries: { isIntersecting: boolean }[]) => void) {
        intersect = (isIntersecting) =>
          act(() => {
            callback([{ isIntersecting }])
          })
      }
      observe() {}
      disconnect() {}
    },
  )
  setHidden(false)
})

afterEach(() => {
  Reflect.deleteProperty(Element.prototype, 'animate')
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('useFilmPlayer', () => {
  it('plays the intro once, then the loop over and over', () => {
    const { result } = renderPlayer()
    expect(result.current.isPlaying).toBe(true)
    expect(result.current.at).toBe(0)
    expect(current().loops).toBe(false)
    advance(6000)
    expect(current().loops).toBe(true)
    // Rests where the loop starts, before the browser takes over
    expect(result.current.at).toBe(6000)
    expect(current().time).toBe(0)
  })

  it('waits for the stage to be on screen before it plays', () => {
    const hook = renderHook(() => useFilmPlayer(FILM, EVERY_4S))
    act(() => {
      hook.result.current.stageRef(stage())
    })
    expect(hook.result.current.isPlaying).toBe(false)
    expect(live()).toHaveLength(0)
    intersect(true)
    // Baked first, between frames, then played from the start
    advance(0)
    expect(current().time).toBe(0)
  })

  it('moves every tracked element, or the parts it names', () => {
    renderPlayer()
    expect(current().targets.map((t) => t.tagName)).toEqual(['DIV', 'I', 'I'])
  })

  it('changes scene on its beats, counting every loop', () => {
    const { result } = renderPlayer()
    expect(result.current.scene).toBe(0)
    advance(4000)
    expect(result.current.scene).toBe(1)
    advance(20_000)
    expect(result.current.scene).toBe(6)
  })

  it('pauses while the tab is hidden, and resumes where it stopped', () => {
    const { result } = renderPlayer()
    advance(1000)
    setHidden(true)
    expect(result.current.isPlaying).toBe(false)
    // Nothing plays while nobody can see it
    expect(live()).toHaveLength(0)
    advance(10_000)
    expect(result.current.scene).toBe(0)
    setHidden(false)
    expect(current().state).toBe('running')
    expect(current().time).toBe(1)
    advance(3000)
    expect(result.current.scene).toBe(1)
  })

  it('pauses while off-screen', () => {
    const { result } = renderPlayer()
    advance(7000)
    intersect(false)
    expect(result.current.isPlaying).toBe(false)
    expect(live()).toHaveLength(0)
    advance(10_000)
    expect(result.current.scene).toBe(1)
    intersect(true)
    expect(current().state).toBe('running')
    // A second into the loop
    expect(current().time).toBe(1)
    advance(1000)
    expect(result.current.scene).toBe(2)
  })

  it('has ended once the intro has played, and not before', () => {
    const { result } = renderPlayer()
    expect(result.current.hasEnded).toBe(false)
    advance(5999)
    expect(result.current.hasEnded).toBe(false)
    advance(1)
    expect(result.current.hasEnded).toBe(true)
  })

  it('replays from the start: the intro again, from 0', () => {
    const { result } = renderPlayer()
    advance(8000)
    act(() => result.current.replay())
    expect(result.current.hasEnded).toBe(false)
    expect(result.current.at).toBe(0)
    expect(result.current.scene).toBe(0)
    expect(current().loops).toBe(false)
    expect(current().time).toBe(0)
    advance(4000)
    expect(result.current.scene).toBe(1)
    advance(2000)
    expect(result.current.hasEnded).toBe(true)
  })

  it('shows the still, nothing moving, with reduced motion', () => {
    reducedMotion = true
    const { result } = renderPlayer()
    expect(result.current.isPlaying).toBe(false)
    expect(result.current.at).toBe(9000)
    expect(result.current.scene).toBe(2)
    advance(20_000)
    expect(result.current.scene).toBe(2)
    expect(live()).toHaveLength(0)
    // Nothing plays, so nothing ends
    expect(result.current.hasEnded).toBe(false)
  })
})
