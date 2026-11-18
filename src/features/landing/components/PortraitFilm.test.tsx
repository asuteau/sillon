// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { PortraitFilm } from './PortraitFilm'

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

// The chart as drawn in focus (each part a sharp copy and a soft twin)
const chart = (name: string) => {
  const [heading] = screen.getAllByRole('heading', { name, hidden: true })
  const section = heading.closest('section')
  if (!section) throw new Error(`No ${name} chart`)
  return section
}

const track = (container: HTMLElement, name: string) =>
  container.querySelector<HTMLElement>(`[data-track="${name}"]`)

describe('PortraitFilm', () => {
  it('is decorative and inert: hidden, out of the tab order', () => {
    const { container } = render(<PortraitFilm />)
    const stage = container.querySelector('[data-slot="portrait-film"]')
    expect(stage?.hasAttribute('inert')).toBe(true)
    expect(stage?.getAttribute('aria-hidden')).toBe('true')
    expect(stage?.querySelectorAll('a, button, [tabindex]')).toHaveLength(0)
  })

  it('shows the Estimated value as the app sets it, with its range', () => {
    render(<PortraitFilm />)
    const [label] = screen.getAllByText('Estimated value')
    const value = label.parentElement
    expect(value?.textContent).toContain('≈ €2.1k')
    expect(value?.textContent).toContain('€1.4k – €3.1k')
  })

  it('tracks each Top artists bar, the copper Leader first', () => {
    const { container } = render(<PortraitFilm />)
    const rows = within(chart('Top artists')).getAllByRole('listitem', {
      hidden: true,
    })
    expect(rows).toHaveLength(5)
    expect(rows[0].textContent).toContain('Marisol Okafor')

    const leader = track(container, 'artistBar:0')?.querySelector(
      track(container, 'artistBar:0')?.dataset.trackTarget ?? '',
    )
    expect(leader).toBe(rows[0].querySelector('.portrait-bar'))
    expect(leader?.classList.contains('bg-(--lacquer-2)')).toBe(true)
  })

  it('tracks each Pressing decade column, read as values', () => {
    const { container } = render(<PortraitFilm />)
    const columns = within(chart('Pressing decade')).getAllByRole('listitem', {
      hidden: true,
    })
    expect(
      columns.map((column) => column.querySelector('.sr-only')?.textContent),
    ).toEqual([
      '1960s, 31 records',
      '1970s, 46 records',
      '1980s, 22 records',
      '1990s, 9 records',
      '2000s, 5 records',
      '2010s, 18 records',
      '2020s, 12 records',
    ])
    const seventies = track(container, 'decadeBar:1')
    expect(seventies?.querySelector(seventies.dataset.trackTarget ?? '')).toBe(
      columns[1].querySelector('.portrait-column'),
    )
  })

  it('holds the sheet in focus with reduced motion', () => {
    reducedMotion = true
    const { container } = render(<PortraitFilm />)
    for (const part of ['figures', 'artists', 'decades'])
      expect(track(container, part)?.style.opacity).toBe('1')
    expect(track(container, 'page')?.style.transform).toContain('rotateX(3deg)')
  })
})
