// @vitest-environment jsdom
import { act, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  GROOVE_INNER_RADIUS,
  GROOVE_OUTER_RADIUS,
  grooveSpiralPath,
} from '#/shared/utils/groove-spiral'

import { LandingPage } from './LandingPage'

const renderLanding = () => render(<LandingPage />)

interface StubObserver {
  callback: IntersectionObserverCallback
  targets: Element[]
  isDisconnected: boolean
}

let reducedMotion = false
let observers: StubObserver[] = []

// jsdom has neither; the hero animation and the closing groove read both
beforeEach(() => {
  reducedMotion = false
  observers = []
  vi.stubGlobal('matchMedia', () => ({
    matches: reducedMotion,
    addEventListener: () => {},
    removeEventListener: () => {},
  }))
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      stub: StubObserver
      constructor(callback: IntersectionObserverCallback) {
        this.stub = { callback, targets: [], isDisconnected: false }
        observers.push(this.stub)
      }
      observe(target: Element) {
        this.stub.targets.push(target)
      }
      disconnect() {
        this.stub.isDisconnected = true
      }
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

const ctaSection = () =>
  screen.getByRole('region', { name: 'Bring your crates.' })

const closingGroove = () => {
  const groove = ctaSection().querySelector('svg')
  if (!groove) throw new Error('No groove in the closing section')
  return groove
}

const ctaObserver = () => {
  const observer = observers.find((o) => o.targets.includes(ctaSection()))
  if (!observer) throw new Error('The closing section is not observed')
  return observer
}

const reportCta = (isIntersecting: boolean) => {
  const observer = ctaObserver()
  act(() =>
    observer.callback(
      [
        {
          isIntersecting,
          target: ctaSection(),
        } as Partial<IntersectionObserverEntry> as IntersectionObserverEntry,
      ],
      {} as IntersectionObserver,
    ),
  )
}

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

  it('runs header, hero, key facts, Challenge, features, call to action, liner notes', () => {
    const { container } = renderLanding()
    expect(container.querySelector('header')).not.toBeNull()
    expect(sectionHeadings()).toEqual([
      'Discogs is a database, not a shelf.',
      'Your collection, in HD.',
      'Your wantlist, fulfilled.',
      'Scan the sleeve.',
      'Nothing to spin?',
      'Your collection, in numbers.',
      'Bring your crates.',
      'Liner notes',
    ])
    const sections = [...container.querySelectorAll('main > section')].map(
      (s) =>
        s.getAttribute('aria-label') ??
        document.getElementById(s.getAttribute('aria-labelledby') ?? '')
          ?.textContent,
    )
    expect(sections).toEqual([
      'Your Discogs collection, cover first.',
      'Key facts',
      'Discogs is a database, not a shelf.',
      'Your collection, in HD.',
      'Your wantlist, fulfilled.',
      'Scan the sleeve.',
      'Nothing to spin?',
      'Your collection, in numbers.',
      'Bring your crates.',
      'Liner notes',
    ])
    const links = screen.getAllByRole('link', { name: 'Connect with Discogs' })
    expect(links).toHaveLength(2)
    for (const link of links)
      expect(link.getAttribute('href')).toBe('/auth/login')
  })

  it('has a sticky header whose anchors resolve to sections', () => {
    const { container } = renderLanding()
    const header = container.querySelector('header')
    if (!header) throw new Error('No landing header')
    const anchors = within(header)
      .getAllByRole('link')
      .filter((a) => a.getAttribute('href')?.startsWith('#'))
    expect(anchors.map((a) => a.textContent)).toEqual([
      'sillon',
      'Features',
      'Portrait',
      'Liner notes',
    ])
    for (const a of anchors) {
      const id = a.getAttribute('href')?.slice(1) ?? ''
      expect(container.querySelector(`#${id}`)).not.toBeNull()
    }
    expect(
      within(header)
        .getByRole('link', { name: 'Connect' })
        .getAttribute('href'),
    ).toBe('/auth/login')
  })

  it('credits Discogs and Deezer in the key facts', () => {
    renderLanding()
    const facts = screen.getByRole('region', { name: 'Key facts' })
    expect(facts.querySelectorAll('li').length).toBeGreaterThanOrEqual(3)
    expect(facts.querySelectorAll('li').length).toBeLessThanOrEqual(4)
    expect(facts.textContent).toContain('Discogs')
    expect(facts.textContent).toContain('Deezer')
    expect(facts.textContent).not.toMatch(/\d/)
  })

  it('leads the Scan copy with one sleeve in a shop, the Stack second', () => {
    renderLanding()
    const scan = screen.getByRole('region', { name: 'Scan the sleeve.' })
    const paragraphs = [...scan.querySelectorAll('p')].map((p) => p.textContent)
    const body = paragraphs.filter((t) => t && t.length > 40)
    expect(body[0]).toMatch(/shop/)
    expect(body[0]).toMatch(/Collection/)
    expect(body[0]).toMatch(/Wantlist/)
    expect(body[1]).toMatch(/Stack/)
  })

  it('anchors the liner notes for /about', () => {
    const { container } = renderLanding()
    const linerNotes = container.querySelector('#liner-notes')
    expect(linerNotes?.textContent).toContain('TanStack Start')
    expect(linerNotes?.textContent).toContain('Aymeric Suteau')
  })

  it('shows House sleeves and generated Covers only, never third-party cover art', () => {
    const { container } = renderLanding()
    expect(container.querySelectorAll('img')).toHaveLength(0)
    expect(
      container.querySelectorAll('[data-layout], [data-theme-art="light"]')
        .length,
    ).toBeGreaterThanOrEqual(8)
  })

  it('keeps the hero film and the feature films out of the tab order', () => {
    const { container } = renderLanding()
    const films = container.querySelectorAll('[data-slot$="-film"]')
    expect(films).toHaveLength(6)
    for (const film of films) {
      expect(film.hasAttribute('inert')).toBe(true)
      expect(film.getAttribute('aria-hidden')).toBe('true')
    }
  })

  it('puts the hero film under the headline and Connect, never over them', () => {
    renderLanding()
    const hero = screen.getAllByRole('region')[0]
    const film = hero.querySelector('[data-slot="hero-film"]')
    if (!film) throw new Error('No hero film')
    const connect = within(hero).getByRole('link', {
      name: 'Connect with Discogs',
    })
    expect(
      connect.compareDocumentPosition(film) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
    expect(film.contains(connect)).toBe(false)
  })

  it('offers no Replay with reduced motion: nothing plays', () => {
    reducedMotion = true
    renderLanding()
    expect(screen.queryByRole('button', { name: 'Replay' })).toBeNull()
  })

  it('follows the voice rules and the glossary', () => {
    const { container } = renderLanding()
    const text = container.textContent
    expect(text).not.toContain('!')
    expect(text).not.toMatch(/\boops\b/i)
    expect(text).not.toMatch(
      /\b(wishlist|library|shuffle|surprise me|artwork|placeholder|owned want|completed want)\b/i,
    )
  })

  describe('closing groove', () => {
    it('is a 96px groove in lacquer tone', () => {
      renderLanding()
      const groove = closingGroove()
      const path = groove.querySelector('path')
      expect(groove.getAttribute('width')).toBe('96')
      expect(path?.getAttribute('d')).toBe(
        grooveSpiralPath({
          turns: 9,
          innerRadius: GROOVE_INNER_RADIUS,
          outerRadius: GROOVE_OUTER_RADIUS,
        }),
      )
      expect(path?.getAttribute('stroke')).toMatch(/^url\(#/)
    })

    it('stays undrawn until the section scrolls into view', () => {
      renderLanding()
      expect(closingGroove().classList).toContain('groove-undrawn')
      reportCta(false)
      expect(closingGroove().classList).toContain('groove-undrawn')
      expect(closingGroove().classList).not.toContain('groove-draw-in')
    })

    it('draws in once on the first intersecting entry, then stops observing', () => {
      renderLanding()
      reportCta(true)
      const groove = closingGroove()
      expect(groove.classList).toContain('groove-draw-in')
      expect(groove.classList).not.toContain('groove-undrawn')
      expect(ctaObserver().isDisconnected).toBe(true)

      reportCta(false)
      reportCta(true)
      expect(closingGroove()).toBe(groove)
      expect(groove.classList).toContain('groove-draw-in')
    })

    it('fades the full groove in with reduced motion, no draw-in', () => {
      reducedMotion = true
      renderLanding()
      reportCta(true)
      expect(closingGroove().classList).toContain('groove-fade-in')
      expect(closingGroove().classList).not.toContain('groove-undrawn')
      expect(closingGroove().classList).not.toContain('groove-draw-in')
    })
  })
})
