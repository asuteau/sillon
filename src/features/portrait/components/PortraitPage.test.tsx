// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { PortraitPageView } from './PortraitPage'

import type { CollectionScan } from '../hooks/use-collection-scan'

vi.mock('@tanstack/react-router', () => ({
  Link: ({
    to,
    search,
    children,
  }: {
    to: string
    search?: Record<string, string>
    children: ReactNode
  }) => (
    <a href={search ? `${to}?${new URLSearchParams(search)}` : to}>
      {children}
    </a>
  ),
}))

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
          isComplete: false,
          hasGap: false,
        }}
      />,
    )

    expect(screen.getByText('Reading 1,200 / 4,000 records')).toBeTruthy()
    expect(screen.queryByText('Top artists')).toBeNull()
    expect(screen.queryByText('Top styles')).toBeNull()
    expect(screen.queryByText('Nirvana')).toBeNull()
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

  it('ranks top artists, each linking to their Discography', () => {
    render(<PortraitPageView {...FIGURES} isEmpty={false} />)

    const link = screen.getByRole('link', { name: /Nirvana/ })
    expect(link.getAttribute('href')).toBe(
      '/search?artistId=125246&artistName=Nirvana',
    )
    expect(screen.getByText('12')).toBeTruthy()
  })

  it('ranks top styles', () => {
    render(<PortraitPageView {...FIGURES} isEmpty={false} />)

    expect(screen.getByText('Top styles')).toBeTruthy()
    expect(screen.getByText('Grunge')).toBeTruthy()
    expect(screen.getByText('14')).toBeTruthy()
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
})
