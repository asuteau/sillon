// @vitest-environment jsdom
import { render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { CollectionLoop } from './CollectionLoop'

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

const renderLoop = () => {
  const { container } = render(<CollectionLoop />)
  const track = (name: string) =>
    container.querySelector<HTMLElement>(`[data-track="${name}"]`)
  return { container, track }
}

describe('CollectionLoop', () => {
  it('is decorative: hidden from assistive tech, inert, nothing to focus', () => {
    const { container } = renderLoop()
    const stage = container.querySelector('[data-slot="collection-loop"]')
    expect(stage?.getAttribute('aria-hidden')).toBe('true')
    expect(stage?.closest('[inert]')).not.toBeNull()
    expect(
      container.querySelectorAll('button, a, input, [tabindex]'),
    ).toHaveLength(0)
  })

  it('holds the Sleeve pull with reduced motion: the centred disc out, the screen shut', () => {
    reducedMotion = true
    const { track } = renderLoop()
    expect(track('disc:0')?.style.transform).toContain('translate(11.2cqw')
    expect(track('sleeve:0')?.style.transform).toContain('translate(-11.2cqw')
    expect(track('slide:0')?.style.opacity).toBe('1')
    expect(track('slide:1')?.style.opacity).toBe('0.5')
    expect(track('screen')?.style.opacity).toBe('0')
    expect(track('caption:0')?.textContent).toContain('Night Ferry')
  })

  it('pulls the disc out in its Vinyl colour, from a generated Cover', () => {
    const { container, track } = renderLoop()
    const disc = track('disc:0')?.querySelector<HTMLElement>('.disc')
    expect(disc?.style.getPropertyValue('--disc-surface')).toMatch(/#|oklab/)
    expect(container.querySelectorAll('img')).toHaveLength(0)
    expect(track('slide:0')?.querySelector('[data-theme-art]')).not.toBeNull()
  })

  it('opens the Record screen on the next record, with its Disc count', () => {
    const { track } = renderLoop()
    const screen = track('screen')
    expect(screen?.textContent).toContain('Slow Arcs')
    expect(screen?.querySelectorAll('.disc-row-slot')).toHaveLength(2)
    expect(track('caption:1')?.textContent).toContain('Slow Arcs')
  })
})
