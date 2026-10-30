// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { PortraitStill } from './PortraitStill'

const chart = (name: string) => {
  const heading = screen.getByRole('heading', { name })
  const section = heading.closest('section')
  if (!section) throw new Error(`No ${name} chart`)
  return section
}

describe('PortraitStill', () => {
  it('shows the Estimated value as the app sets it, with its range', () => {
    render(<PortraitStill />)
    const value = screen.getByText('Estimated value').parentElement
    expect(value?.textContent).toContain('≈ €2.1K')
    expect(value?.textContent).toContain('€1.4K – €3.1K')
  })

  it('ranks five Top artists, one copper Leader bar, no copper text', () => {
    const { container } = render(<PortraitStill />)
    const rows = within(chart('Top artists')).getAllByRole('listitem')
    expect(rows).toHaveLength(5)
    expect(rows[0].textContent).toContain('Marisol Okafor')

    const bars = rows.map((row) => row.querySelector('.portrait-bar'))
    const leaders = bars.filter((bar) =>
      bar?.classList.contains('bg-(--lacquer-2)'),
    )
    expect(leaders).toEqual([bars[0]])
    expect(container.innerHTML).not.toMatch(/text-\(--lacquer|text-primary/)
  })

  it('draws a Pressing decade column per decade, read as values', () => {
    render(<PortraitStill />)
    const columns = within(chart('Pressing decade')).getAllByRole('listitem')
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
  })
})
