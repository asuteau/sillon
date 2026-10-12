// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { DISCOGS_NOTICE } from '#/shared/utils/legal'

import { Footer } from './Footer'

vi.mock('@tanstack/react-router', () => ({
  Link: ({
    to,
    children,
    className,
  }: {
    to: string
    children: ReactNode
    className?: string
  }) => (
    <a href={to} className={className}>
      {children}
    </a>
  ),
}))

describe('Footer', () => {
  it('shows the Discogs notice and links to /legal', () => {
    render(<Footer />)

    expect(screen.getByText(DISCOGS_NOTICE)).toBeTruthy()
    expect(
      screen.getByRole('link', { name: 'Legal' }).getAttribute('href'),
    ).toBe('/legal')
  })

  it('clears the mobile BottomNav and Scan button', () => {
    const { container } = render(<Footer />)

    expect(container.querySelector('footer')?.className).toMatch(/\bpb-32\b/)
  })
})
