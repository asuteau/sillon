// @vitest-environment jsdom
import { fireEvent, render, screen, within } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { PortraitPageView } from './PortraitPage'

import type { CollectionScan } from '../hooks/use-collection-scan'

vi.mock('@tanstack/react-router', () => ({
  Link: ({
    to,
    search,
    children,
    'aria-label': ariaLabel,
  }: {
    'aria-label'?: string
    to: string
    search?: Record<string, string | number>
    children: ReactNode
  }) => (
    <a
      href={
        search
          ? `${to}?${new URLSearchParams(
              Object.entries(search).map(([key, value]) => [
                key,
                String(value),
              ]),
            )}`
          : to
      }
      aria-label={ariaLabel}
    >
      {children}
    </a>
  ),
}))

beforeEach(() => {
  vi.stubGlobal('matchMedia', () => ({
    matches: false,
    addEventListener: () => {},
    removeEventListener: () => {},
  }))
})

afterEach(() => {
  vi.unstubAllGlobals()
})

const READ: CollectionScan = {
  status: 'read',
  topArtists: [
    { id: 125246, name: 'Nirvana', copies: 12 },
    { id: 33285, name: 'Korn', copies: 3 },
  ],
  topStyles: [
    { name: 'Grunge', copies: 14 },
    { name: 'Nu Metal', copies: 3 },
  ],
  pressingDecades: {
    decades: [
      { decade: 1990, copies: 9 },
      { decade: 2000, copies: 0 },
      { decade: 2010, copies: 5 },
    ],
    noYear: 42,
  },
  additionsByYear: [
    { year: 2024, copies: 7 },
    { year: 2025, copies: 0 },
    { year: 2026, copies: 4 },
  ],
}

const FIGURES = {
  username: 'digger',
  recordCount: '2,140',
  estimatedValue: '≈ €18.4K',
  valueRange: '€9.1K – €31.3K',
  scan: READ,
  onRetryScan: () => {},
}

describe('PortraitPageView', () => {
  it('shows the headline figures with one Discogs attribution', () => {
    render(<PortraitPageView {...FIGURES} isEmpty={false} />)

    expect(screen.getByText('≈ €18.4K')).toBeTruthy()
    expect(screen.getByText('€9.1K – €31.3K')).toBeTruthy()
    expect(screen.getByText('2,140')).toBeTruthy()
    const attributions = screen.getAllByRole('link', {
      name: 'Data provided by Discogs',
    })
    expect(attributions).toHaveLength(1)
    expect(attributions[0]?.getAttribute('href')).toBe(
      'https://www.discogs.com/user/digger/collection',
    )
  })

  it('shows only the empty line for an empty Collection', () => {
    render(<PortraitPageView {...FIGURES} isEmpty />)

    expect(
      screen.getByText(/Your portrait appears once you add records/),
    ).toBeTruthy()
    expect(
      screen.getByRole('link', { name: 'Search' }).getAttribute('href'),
    ).toBe('/search')
    expect(screen.queryByText('2,140')).toBeNull()
    expect(
      screen.queryByRole('link', { name: 'Data provided by Discogs' }),
    ).toBeNull()
  })

  it('holds logout at its foot', () => {
    render(<PortraitPageView {...FIGURES} isEmpty />)

    expect(
      screen.getByRole('link', { name: /Logout/ }).getAttribute('href'),
    ).toBe('/auth/logout')
  })

  it('shows progress while reading, and no scan figure', () => {
    render(
      <PortraitPageView
        {...FIGURES}
        isEmpty={false}
        scan={{
          status: 'reading',
          read: 1200,
          total: 4000,
          requestsLeft: 28,
          isComplete: false,
          hasGap: false,
        }}
      />,
    )

    expect(
      screen.getByRole('progressbar', { name: 'Reading your collection' }),
    ).toBeTruthy()
    expect(screen.getByText('1,200 of 4,000')).toBeTruthy()
    expect(screen.getByText('about 42 s left')).toBeTruthy()
    expect(screen.queryByText('Top artists')).toBeNull()
    expect(screen.queryByText('Top styles')).toBeNull()
    expect(screen.queryByText('Nirvana')).toBeNull()
    expect(screen.queryByText('Pressing decade')).toBeNull()
    expect(screen.queryByText('Additions by year')).toBeNull()
  })

  it('offers to read on when a page fails', () => {
    const onRetryScan = vi.fn()
    render(
      <PortraitPageView
        {...FIGURES}
        isEmpty={false}
        scan={{
          status: 'failed',
          read: 100,
          total: 4000,
          requestsLeft: 39,
          isComplete: false,
          hasGap: false,
        }}
        onRetryScan={onRetryScan}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(onRetryScan).toHaveBeenCalledOnce()
    expect(screen.queryByText('Top artists')).toBeNull()
  })

  it('ranks top artists, each opening the Collection filtered by them', () => {
    render(<PortraitPageView {...FIGURES} isEmpty={false} />)

    const link = screen.getByRole('link', { name: 'Nirvana, 12 records' })
    expect(link.getAttribute('href')).toBe('/collection?artist=125246')
    expect(screen.queryByRole('link', { name: /Discography/ })).toBeNull()
    expect(
      screen.getAllByRole('link').map((each) => each.getAttribute('href')),
    ).not.toContainEqual(expect.stringContaining('/search?'))
  })

  it('ranks top styles, each opening the Collection filtered by it', () => {
    render(<PortraitPageView {...FIGURES} isEmpty={false} />)

    expect(screen.getByText('Top styles')).toBeTruthy()
    expect(
      screen
        .getByRole('link', { name: 'Grunge, 14 records' })
        .getAttribute('href'),
    ).toBe('/collection?style=Grunge')
    expect(
      screen
        .getByRole('link', { name: 'Nu Metal, 3 records' })
        .getAttribute('href'),
    ).toBe('/collection?style=Nu+Metal')
  })

  it('hides a section with nothing to say', () => {
    render(
      <PortraitPageView
        {...FIGURES}
        isEmpty={false}
        scan={{ ...READ, topArtists: [] }}
      />,
    )

    expect(screen.queryByText('Top artists')).toBeNull()
    expect(screen.getByText('Top styles')).toBeTruthy()
  })

  it('charts Pressing decade, gaps included, as a list of values', () => {
    render(<PortraitPageView {...FIGURES} isEmpty={false} />)

    const items = within(
      screen.getByRole('list', { name: 'Pressing decade' }),
    ).getAllByRole('listitem')
    expect(items.map((item) => item.textContent)).toEqual([
      expect.stringContaining('1990s, 9 records'),
      expect.stringContaining('2000s, 0 records'),
      expect.stringContaining('2010s, 5 records'),
    ])
    expect(screen.getByText('42 records with no year')).toBeTruthy()
  })

  it('opens the Collection filtered by a Pressing decade, not an empty one', () => {
    render(<PortraitPageView {...FIGURES} isEmpty={false} />)

    const list = screen.getByRole('list', { name: 'Pressing decade' })
    expect(
      within(list)
        .getByRole('link', { name: '1990s, 9 records' })
        .getAttribute('href'),
    ).toBe('/collection?decade=1990')
    expect(
      within(list)
        .getByRole('link', { name: '2010s, 5 records' })
        .getAttribute('href'),
    ).toBe('/collection?decade=2010')
    expect(within(list).queryByRole('link', { name: /2000s/ })).toBeNull()
  })

  it('hides the no-year note when every Copy has a year', () => {
    render(
      <PortraitPageView
        {...FIGURES}
        isEmpty={false}
        scan={{
          ...READ,
          pressingDecades: { ...READ.pressingDecades, noYear: 0 },
        }}
      />,
    )

    expect(screen.getByText('Pressing decade')).toBeTruthy()
    expect(screen.queryByText(/with no year/)).toBeNull()
  })

  it('notes no-year Copies even with no decade to chart', () => {
    render(
      <PortraitPageView
        {...FIGURES}
        isEmpty={false}
        scan={{ ...READ, pressingDecades: { decades: [], noYear: 1 } }}
      />,
    )

    expect(screen.queryByRole('list', { name: 'Pressing decade' })).toBeNull()
    expect(screen.getByText('1 record with no year')).toBeTruthy()
  })

  it('charts Additions by year, gaps included', () => {
    render(<PortraitPageView {...FIGURES} isEmpty={false} />)

    const items = within(
      screen.getByRole('list', { name: 'Additions by year' }),
    ).getAllByRole('listitem')
    expect(items.map((item) => item.textContent)).toEqual([
      expect.stringContaining('2024, 7 records'),
      expect.stringContaining('2025, 0 records'),
      expect.stringContaining('2026, 4 records'),
    ])
  })

  it('opens the Collection filtered by an added year, not an empty one', () => {
    render(<PortraitPageView {...FIGURES} isEmpty={false} />)

    const list = screen.getByRole('list', { name: 'Additions by year' })
    expect(
      within(list)
        .getByRole('link', { name: '2024, 7 records' })
        .getAttribute('href'),
    ).toBe('/collection?added=2024')
    expect(within(list).queryByRole('link', { name: /2025/ })).toBeNull()
  })
})
