// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { SortChips } from './SortChips'

describe('SortChips', () => {
  it('renders round chips, the active one solid foreground', () => {
    render(
      <SortChips value={{ sort: 'year', order: 'asc' }} onSelect={() => {}} />,
    )

    const active = screen.getByRole('button', { name: 'Year, ascending' })
    const idle = screen.getByRole('button', { name: 'Artist' })

    for (const chip of [active, idle]) {
      expect(chip.className).toMatch(/\brounded-full\b/)
      expect(chip.className).not.toMatch(/--sea-ink|--chip/)
    }
    expect(active.getAttribute('aria-pressed')).toBe('true')
    expect(active.className).toMatch(/\bbg-foreground\b/)
    expect(active.className).toMatch(/\btext-background\b/)
    expect(idle.className).not.toMatch(/\bbg-foreground\b/)
    expect(idle.className).toMatch(/\bborder-border\b/)
  })
})
