// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ReadingState } from './ReadingState'

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

describe('ReadingState', () => {
  it('reads out the list, the count and the time left, never a percentage', () => {
    render(
      <ReadingState
        list="collection"
        read={1200}
        total={4000}
        requestsLeft={3}
      />,
    )

    expect(screen.getByText('Reading your collection')).toBeTruthy()
    expect(screen.getByText('1,200 of 4,000')).toBeTruthy()
    expect(screen.getByText('about 5 s left')).toBeTruthy()
    expect(screen.queryByText(/%/)).toBeNull()
  })

  it('names the Wantlist when reading it', () => {
    render(
      <ReadingState list="wantlist" read={20} total={300} requestsLeft={14} />,
    )

    expect(screen.getByText('Reading your wantlist')).toBeTruthy()
  })

  it('exposes the progress to assistive tech', () => {
    render(
      <ReadingState
        list="collection"
        read={1200}
        total={4000}
        requestsLeft={3}
      />,
    )

    const progress = screen.getByRole('progressbar', {
      name: 'Reading your collection',
    })
    expect(progress.getAttribute('aria-valuenow')).toBe('1200')
    expect(progress.getAttribute('aria-valuemax')).toBe('4000')
    expect(progress.getAttribute('aria-valuetext')).toBe('1,200 of 4,000')
  })

  it('draws the groove to the share read', () => {
    const { container } = render(
      <ReadingState
        list="collection"
        read={1200}
        total={4000}
        requestsLeft={3}
      />,
    )

    const drawn = container.querySelector<SVGPathElement>(
      '[data-reading-groove]',
    )
    expect(Number(drawn?.style.strokeDashoffset)).toBeCloseTo(0.7)
  })

  it('shows no count before the record count is known', () => {
    render(
      <ReadingState
        list="collection"
        read={0}
        total={undefined}
        requestsLeft={undefined}
      />,
    )

    expect(screen.getByText('Reading your collection')).toBeTruthy()
    expect(screen.queryByText(/ of /)).toBeNull()
    expect(screen.queryByText(/left/)).toBeNull()
  })
})
