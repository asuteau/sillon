// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { ScanStill } from './ScanStill'

describe('ScanStill', () => {
  it('shows a Stack of three records, one Unresolved', () => {
    const { container } = render(<ScanStill />)

    const rows = container.querySelectorAll('ul > li')
    expect(rows).toHaveLength(3)
    expect(screen.getByText('3 releases — choose')).toBeTruthy()
    expect(screen.queryByText('Found on Discogs')).toBeNull()
  })

  it('counts the whole Stack on its badge', () => {
    render(<ScanStill />)

    const head = screen.getByText('Stack').parentElement
    expect(head && within(head).getByText('3')).toBeTruthy()
  })

  it('leaves the Unresolved record out of the confirm count', () => {
    render(<ScanStill />)

    expect(screen.getByText('Add 2 to Collection')).toBeTruthy()
    expect(screen.getByText('1 to choose')).toBeTruthy()
  })

  it('uses House sleeves, never cover art', () => {
    const { container } = render(<ScanStill />)

    expect(container.querySelectorAll('img')).toHaveLength(0)
    expect(
      container.querySelectorAll('ul [data-layout]').length,
    ).toBeGreaterThanOrEqual(3)
  })
})
