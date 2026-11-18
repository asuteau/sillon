// @vitest-environment jsdom
import { render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { RandomPickFilm } from './RandomPickFilm'

let reducedMotion = false

beforeEach(() => {
  reducedMotion = false
  vi.stubGlobal('matchMedia', () => ({
    matches: reducedMotion,
    addEventListener: () => {},
    removeEventListener: () => {},
  }))
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      observe() {}
      disconnect() {}
    },
  )
})

afterEach(() => {
  vi.unstubAllGlobals()
})

const track = (container: HTMLElement, name: string) =>
  container.querySelector<HTMLElement>(`[data-track="${name}"]`)

describe('RandomPickFilm', () => {
  it('is decorative: hidden from assistive tech, inert, nothing focusable', () => {
    const { container } = render(<RandomPickFilm />)
    const film = container.querySelector('[data-slot="random-pick-film"]')
    expect(film?.getAttribute('aria-hidden')).toBe('true')
    expect(film?.closest('[inert]')).not.toBeNull()
  })

  it('opens on the crate at rest, "Pick for me" shown', () => {
    const { container } = render(<RandomPickFilm />)
    expect(track(container, 'pickFor')?.style.opacity).toBe('1')
    expect(track(container, 'caption:a')?.style.opacity).toBe('0')
  })

  it('holds the first pick drawn with reduced motion: disc out, heading shown', () => {
    reducedMotion = true
    const { container } = render(<RandomPickFilm />)
    expect(track(container, 'caption:a')?.style.opacity).toBe('1')
    expect(track(container, 'caption:a')?.textContent).toContain('Night Ferry')
    expect(track(container, 'disc:a')?.style.transform).toContain(
      'translate3d(16cqw',
    )
    expect(track(container, 'pickAgain')?.style.opacity).toBe('1')
    expect(track(container, 'pickFor')?.style.opacity).toBe('0')
  })
})
