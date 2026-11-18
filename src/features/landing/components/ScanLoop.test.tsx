// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ScanLoop } from './ScanLoop'

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
  container.querySelector<HTMLElement>('[data-slot="scan-film"]')
const track = (container: HTMLElement, name: string) =>
  container.querySelector<HTMLElement>(`[data-track="${name}"]`)

describe('ScanLoop', () => {
  it('is decorative and inert, out of the tab order', () => {
    const { container } = render(<ScanLoop />)
    const loop = stage(container)
    expect(loop?.hasAttribute('inert')).toBe(true)
    expect(loop?.getAttribute('aria-hidden')).toBe('true')
  })

  it('scans one sleeve at a time, each a Stack of one, for the Collection then the Wantlist', () => {
    render(<ScanLoop />)
    expect(screen.getAllByText('Add 1 to Collection')).toHaveLength(2)
    expect(screen.getByText('Add 1 to Wantlist')).toBeTruthy()
    expect(screen.getByText('1 record added to your Collection.')).toBeTruthy()
    expect(screen.getByText('1 record added to your Wantlist.')).toBeTruthy()
  })

  it('shows a barcode on each sleeve’s back, and generated Covers, never cover art', () => {
    const { container } = render(<ScanLoop />)
    expect(container.querySelectorAll('img')).toHaveLength(0)
    // On the sleeve, and on its soft twin
    expect(screen.getAllByText('5 021732 098143').length).toBeGreaterThan(0)
  })

  it('holds the matched sleeve with reduced motion: the panel up, the finder gone', () => {
    reducedMotion = true
    const { container } = render(<ScanLoop />)
    expect(track(container, 'panel:a')?.style.opacity).toBe('1')
    expect(track(container, 'finder')?.style.opacity).toBe('0')
    expect(track(container, 'sent:a')?.style.opacity).toBe('0')
  })
})
