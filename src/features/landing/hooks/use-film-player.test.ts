// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { Beats, Score } from '../film/film.model'
import { useFilmPlayer } from './use-film-player'

interface FakeControls {
  targets: Element[]
  options: { repeat?: number }
  time: number
  state: 'running' | 'paused' | 'idle'
}

// The engine at its boundary: record what the player asks Motion to play
let played: FakeControls[] = []
vi.mock('motion', () => ({
  animate: (
    sequence: [Element[], unknown, unknown][],
    options: { repeat?: number } = {},
  ) => {
    const controls: FakeControls = {
      targets: sequence.flatMap(([targets]) => targets),
      options,
      time: 0,
      state: 'running',
    }
    played.push(controls)
    return Object.assign(controls, {
      play: () => (controls.state = 'running'),
      pause: () => (controls.state = 'paused'),
      cancel: () => (controls.state = 'idle'),
    })
  },
}))
const live = () => played.filter((c) => c.state !== 'idle')
const current = () => {
  expect(live()).toHaveLength(1)
  return live()[0]
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
    pick: { transform: [{ scale: 1 }] },
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
  return hook
}

beforeEach(() => {
  vi.useFakeTimers()
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
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('useFilmPlayer', () => {
  it('plays the intro once, then the loop over and over', () => {
    const { result } = renderPlayer()
    expect(result.current.isPlaying).toBe(true)
    expect(result.current.at).toBe(0)
    expect(current().options.repeat).toBeUndefined()
    advance(6000)
    expect(current().options.repeat).toBe(Infinity)
    // Rests where the loop starts, before Motion takes over
    expect(result.current.at).toBe(6000)
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
    expect(current().state).toBe('paused')
    expect(current().time).toBe(1)
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
    expect(current().state).toBe('paused')
    // A second into the loop
    expect(current().time).toBe(1)
    advance(10_000)
    expect(result.current.scene).toBe(1)
    intersect(true)
    expect(current().state).toBe('running')
    advance(1000)
    expect(result.current.scene).toBe(2)
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
  })
})
