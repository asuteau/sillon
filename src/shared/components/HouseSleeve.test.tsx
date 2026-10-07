// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { houseSleeve } from '#/shared/utils/house-sleeve'

import { HouseSleeve } from './HouseSleeve'

const record = { artist: 'Alice Coltrane', title: 'Journey in Satchidananda' }

describe('HouseSleeve', () => {
  it('is typeset with the artist and title', () => {
    render(<HouseSleeve {...record} />)
    expect(screen.getByText('Alice Coltrane')).toBeTruthy()
    expect(screen.getByText('Journey in Satchidananda')).toBeTruthy()
  })

  it('renders the design picked for the record', () => {
    const { container } = render(<HouseSleeve {...record} />)
    const sleeve = container.firstElementChild as HTMLElement
    const design = houseSleeve(record)
    expect(sleeve.dataset.layout).toBe(design.layout)
    expect(sleeve.style.background).toBeTruthy()
    expect(sleeve.className).toContain('aspect-square')
    expect(sleeve.className).toContain('rounded-lg')
  })

  it('falls back to the title initial at small sizes', () => {
    render(<HouseSleeve {...record} />)
    expect(screen.getByText('J')).toBeTruthy()
  })
})
