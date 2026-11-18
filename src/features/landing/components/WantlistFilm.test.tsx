// @vitest-environment jsdom
import { render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { WantlistFilm } from './WantlistFilm'

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

const stage = (container: HTMLElement) =>
  container.querySelector<HTMLElement>('[data-slot="wantlist-film"]')
const track = (container: HTMLElement, name: string) =>
  container.querySelector<HTMLElement>(`[data-track="${name}"]`)

describe('WantlistFilm', () => {
  it('is decorative: hidden from assistive tech, inert, out of the tab order', () => {
    const { container } = render(<WantlistFilm />)
    const film = stage(container)
    expect(film?.getAttribute('aria-hidden')).toBe('true')
    expect(film?.hasAttribute('inert')).toBe(true)
  })

  it('shows the want on the Wantlist and the same record on the Record screen', () => {
    const { container } = render(<WantlistFilm />)
    expect(track(container, 'want')?.textContent).toContain('Second Pressing')
    expect(track(container, 'screen')?.textContent).toContain('Second Pressing')
    expect(container.querySelectorAll('img')).toHaveLength(0)
  })

  it('holds the offer with reduced motion: Owned, the prompt up', () => {
    reducedMotion = true
    const { container } = render(<WantlistFilm />)
    expect(track(container, 'exposure')?.style.opacity).toBe('1')
    expect(track(container, 'owned')?.style.opacity).toBe('1')
    expect(track(container, 'owned')?.textContent).toContain('Owned')
    expect(track(container, 'prompt')?.style.opacity).toBe('1')
    expect(track(container, 'prompt')?.textContent).toContain(
      'Now in your collection',
    )
  })
})
