// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { RecordHeading } from './RecordHeading'

describe('RecordHeading', () => {
  it('sets artist, title and catalogue lines in their type roles', () => {
    render(
      <RecordHeading
        artist="Miles Davis"
        title="Kind of Blue"
        catalogue={['1959 · US', 'Vinyl · LP · Album', 'Columbia · CL 1355']}
      />,
    )

    expect(screen.getByText('Miles Davis').className).toMatch(/\btype-caps\b/)
    const title = screen.getByRole('heading', { level: 2 })
    expect(title.textContent).toBe('Kind of Blue')
    expect(title.className).toMatch(/\btype-display\b/)
    for (const line of [
      '1959 · US',
      'Vinyl · LP · Album',
      'Columbia · CL 1355',
    ])
      expect(screen.getByText(line).className).toMatch(/\btype-catalogue\b/)
  })

  it('skips empty artist and catalogue lines', () => {
    const { container } = render(
      <RecordHeading
        artist=""
        title="Untitled"
        catalogue={['', null, '1972']}
      />,
    )

    expect(container.querySelector('.type-caps')).toBeNull()
    expect(container.querySelectorAll('.type-catalogue')).toHaveLength(1)
  })
})
