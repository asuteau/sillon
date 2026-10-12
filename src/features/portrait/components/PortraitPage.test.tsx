// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { PortraitPageView } from './PortraitPage'

vi.mock('@tanstack/react-router', () => ({
  Link: ({ to, children }: { to: string; children: ReactNode }) => (
    <a href={to}>{children}</a>
  ),
}))

const FIGURES = {
  username: 'digger',
  recordCount: '2,140',
  estimatedValue: '≈ €18.4K',
  valueRange: '€9.1K – €31.3K',
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

  it('holds the theme toggle and logout at its foot', () => {
    render(<PortraitPageView {...FIGURES} isEmpty />)

    expect(screen.getByRole('button', { name: /Theme mode/ })).toBeTruthy()
    expect(
      screen.getByRole('link', { name: /Logout/ }).getAttribute('href'),
    ).toBe('/auth/logout')
  })
})
