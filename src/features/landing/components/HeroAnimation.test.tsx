// @vitest-environment jsdom
import { render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { HeroAnimation } from './HeroAnimation'

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
  container.querySelector<HTMLElement>('[data-slot="hero-animation"]')
const track = (container: HTMLElement, name: string) =>
  container.querySelector<HTMLElement>(`[data-track="${name}"]`)

describe('HeroAnimation', () => {
  it('is decorative, inert and frameless, holding the 4:5 space', () => {
    const { container } = render(<HeroAnimation />)
    const hero = stage(container)
    expect(hero?.hasAttribute('inert')).toBe(true)
    expect(hero?.getAttribute('aria-hidden')).toBe('true')
    expect(hero?.className).toContain('aspect-4/5')
    expect(hero?.className).not.toMatch(/\bborder\b/)
  })

  it('holds the Sleeve pull pose with reduced motion: the disc pulled out', () => {
    reducedMotion = true
    const { container } = render(<HeroAnimation />)
    expect(track(container, 'disc:0')?.style.opacity).toBe('1')
    expect(track(container, 'disc:0')?.style.transform).toContain(
      'translate(10cqw',
    )
    expect(track(container, 'sleeve:0')?.style.transform).toContain(
      'translate(-10cqw',
    )
    expect(track(container, 'groove')?.style.opacity).toBe('0')
    expect(track(container, 'screen')?.style.opacity).toBe('0')
  })

  it('shows the Disc count on the Record screen: two discs for the second record', () => {
    const { container } = render(<HeroAnimation />)
    const screen = track(container, 'screen')
    expect(screen?.textContent).toContain('Slow Arcs')
    expect(screen?.querySelectorAll('.disc-row-slot')).toHaveLength(2)
  })

  it('opens on a disc in its Vinyl colour, from a House sleeve', () => {
    const { container } = render(<HeroAnimation />)
    const disc = track(container, 'disc:0')?.querySelector<HTMLElement>('.disc')
    expect(disc?.style.getPropertyValue('--disc-surface')).not.toBe('')
    expect(container.querySelectorAll('img')).toHaveLength(0)
  })
})
