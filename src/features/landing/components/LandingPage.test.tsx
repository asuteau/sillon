// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { LandingPage } from './LandingPage'

const renderLanding = () => render(<LandingPage />)

// jsdom has neither; the hero animation reads both
beforeEach(() => {
  vi.stubGlobal('matchMedia', () => ({
    matches: false,
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

// Headings inside the inert stills are hidden from assistive tech in browsers
const sectionHeadings = () =>
  screen
    .getAllByRole('heading', { level: 2 })
    .filter((heading) => !heading.closest('[inert]'))
    .map((heading) => heading.textContent)

describe('LandingPage', () => {
  it('opens on the hero: headline, the name and the CTA', () => {
    renderLanding()
    const hero = screen.getAllByRole('region')[0]
    expect(within(hero).getByRole('heading', { level: 1 })).toBeTruthy()
    expect(hero.textContent).toContain('French for the groove in a record.')
    expect(
      within(hero)
        .getByRole('link', { name: 'Connect with Discogs' })
        .getAttribute('href'),
    ).toBe('/auth/login')
  })

  it('shows the features, then a final call to action, then the liner notes', () => {
    renderLanding()
    expect(sectionHeadings()).toEqual([
      'Your collection, in HD.',
      'Your wantlist, fulfilled.',
      'Scan the sleeve.',
      'Nothing to spin?',
      'Bring your crates.',
      'Liner notes',
    ])
    const links = screen.getAllByRole('link', { name: 'Connect with Discogs' })
    expect(links).toHaveLength(2)
    for (const link of links)
      expect(link.getAttribute('href')).toBe('/auth/login')
  })

  it('anchors the liner notes for /about', () => {
    const { container } = renderLanding()
    const linerNotes = container.querySelector('#liner-notes')
    expect(linerNotes?.textContent).toContain('TanStack Start')
    expect(linerNotes?.textContent).toContain('Aymeric Suteau')
  })

  it('shows House sleeves only, never third-party cover art', () => {
    const { container } = renderLanding()
    expect(container.querySelectorAll('img')).toHaveLength(0)
    expect(
      container.querySelectorAll('[data-layout]').length,
    ).toBeGreaterThanOrEqual(8)
  })

  it('keeps the stills out of the tab order', () => {
    const { container } = renderLanding()
    const stills = container.querySelectorAll('[data-slot="landing-still"]')
    expect(stills).toHaveLength(4)
    for (const still of [
      ...stills,
      container.querySelector('[data-slot="hero-animation"]'),
    ])
      expect(still?.hasAttribute('inert')).toBe(true)
  })

  it('follows the voice rules and the glossary', () => {
    const { container } = renderLanding()
    const text = container.textContent
    expect(text).not.toContain('!')
    expect(text).not.toMatch(/\boops\b/i)
    expect(text).not.toMatch(
      /\b(wishlist|library|shelf|shuffle|surprise me|artwork|placeholder|owned want|completed want)\b/i,
    )
  })
})
