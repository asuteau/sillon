// @vitest-environment jsdom
import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { HeroFilm } from './HeroFilm'
import { HERO_HOLD_FROM_MS } from '../hero/hero.score'

let reducedMotion = false
let wide = true

beforeEach(() => {
  vi.useFakeTimers()
  reducedMotion = false
  wide = true
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: query.includes('reduce') ? reducedMotion : wide,
    addEventListener: () => {},
    removeEventListener: () => {},
  }))
  // On screen as soon as it's observed
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      constructor(
        private report: (entries: { isIntersecting: boolean }[]) => void,
      ) {}
      observe() {
        this.report([{ isIntersecting: true }])
      }
      disconnect() {}
    },
  )
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

const film = (container: HTMLElement) =>
  container.querySelector<HTMLElement>('[data-slot="hero-film"]')
const track = (container: HTMLElement, name: string) =>
  container.querySelector<HTMLElement>(`[data-track="${name}"]`)

const FOCUSABLE = 'a[href], button, input, select, textarea, [tabindex]'

const playToTheEnd = () =>
  act(() => {
    vi.advanceTimersByTime(HERO_HOLD_FROM_MS)
  })

describe('HeroFilm', () => {
  it('is decorative and inert, with nothing to focus while it plays', () => {
    const { container } = render(<HeroFilm />)
    expect(film(container)?.hasAttribute('inert')).toBe(true)
    expect(film(container)?.getAttribute('aria-hidden')).toBe('true')
    expect(container.querySelectorAll(FOCUSABLE)).toHaveLength(0)
  })

  it('opens on the page ground, before the Challenge fades up', () => {
    const { container } = render(<HeroFilm />)
    expect(track(container, 'exposure')?.style.opacity).toBe('1')
  })

  it('offers Replay once the film has ended: the only control, labelled', () => {
    const { container } = render(<HeroFilm />)
    act(() => {
      vi.advanceTimersByTime(HERO_HOLD_FROM_MS - 1)
    })
    expect(screen.queryByRole('button', { name: 'Replay' })).toBeNull()
    act(() => {
      vi.advanceTimersByTime(1)
    })
    const replay = screen.getByRole('button', { name: 'Replay' })
    expect([...container.querySelectorAll(FOCUSABLE)]).toEqual([replay])
    expect(film(container)?.contains(replay)).toBe(false)
  })

  it('plays the film again from the start on Replay', () => {
    const { container } = render(<HeroFilm />)
    playToTheEnd()
    expect(track(container, 'exposure')?.style.opacity).toBe('0')
    fireEvent.click(screen.getByRole('button', { name: 'Replay' }))
    expect(track(container, 'exposure')?.style.opacity).toBe('1')
    expect(screen.queryByRole('button', { name: 'Replay' })).toBeNull()
    playToTheEnd()
    expect(screen.getByRole('button', { name: 'Replay' })).toBeTruthy()
  })

  it('shows the hero record’s disc out, and no Replay, with reduced motion', () => {
    reducedMotion = true
    const { container } = render(<HeroFilm />)
    expect(track(container, 'disc')?.style.transform).not.toContain(
      'translate3d(0cqw',
    )
    expect(track(container, 'exposure')?.style.opacity).toBe('0')
    playToTheEnd()
    expect(screen.queryByRole('button', { name: 'Replay' })).toBeNull()
  })

  it('frames the film for a phone, about 4:5', () => {
    wide = false
    const { container } = render(<HeroFilm />)
    // The 4:5 wall is three Covers wide, five down
    expect(container.querySelectorAll('[data-track="w14"]')).toHaveLength(1)
    expect(container.querySelectorAll('[data-track="w15"]')).toHaveLength(0)
  })
})
