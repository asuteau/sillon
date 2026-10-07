// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import {
  GROOVE_INNER_RADIUS,
  GROOVE_OUTER_RADIUS,
  grooveSpiralPath,
} from '#/shared/utils/groove-spiral'

import { GrooveLoader } from './GrooveLoader'
import { GrooveMark } from './GrooveMark'
import { Wordmark } from './Wordmark'

const spiralFor = (turns: number) =>
  grooveSpiralPath({
    turns,
    innerRadius: GROOVE_INNER_RADIUS,
    outerRadius: GROOVE_OUTER_RADIUS,
  })

const pathOf = (container: HTMLElement) => {
  const path = container.querySelector('path')
  if (!path) throw new Error('no path rendered')
  return path
}

describe('GrooveMark', () => {
  it.each([
    [96, 9],
    [48, 6],
    [32, 4],
    [16, 2.5],
  ])('draws %spx with %s turns', (size, turns) => {
    const { container } = render(<GrooveMark size={size} />)
    expect(pathOf(container).getAttribute('d')).toBe(spiralFor(turns))
    expect(container.querySelector('svg')?.getAttribute('width')).toBe(
      String(size),
    )
  })

  it('thickens the stroke at favicon sizes', () => {
    const small = pathOf(render(<GrooveMark size={16} />).container)
    const large = pathOf(render(<GrooveMark size={96} />).container)
    expect(Number(small.getAttribute('stroke-width'))).toBeGreaterThan(
      Number(large.getAttribute('stroke-width')),
    )
  })

  it('uses currentColor by default', () => {
    const { container } = render(<GrooveMark size={26} />)
    expect(pathOf(container).getAttribute('stroke')).toBe('currentColor')
  })

  it('strokes with its own lacquer gradient', () => {
    const { container } = render(
      <>
        <GrooveMark size={96} tone="lacquer" />
        <GrooveMark size={96} tone="lacquer" />
      </>,
    )
    const gradients = [...container.querySelectorAll('linearGradient')]
    const strokes = [...container.querySelectorAll('path')].map((p) =>
      p.getAttribute('stroke'),
    )
    expect(gradients).toHaveLength(2)
    expect(new Set(gradients.map((g) => g.id)).size).toBe(2)
    expect(strokes).toEqual(gradients.map((g) => `url(#${g.id})`))
  })

  it('is decorative unless labelled', () => {
    const { container } = render(<GrooveMark size={26} />)
    expect(container.querySelector('svg')?.getAttribute('aria-hidden')).toBe(
      'true',
    )
    render(<GrooveMark size={26} label="Sillon" />)
    expect(screen.getByRole('img', { name: 'Sillon' })).toBeTruthy()
  })
})

describe('Wordmark', () => {
  it('renders the lowercase name', () => {
    render(<Wordmark />)
    expect(screen.getByText('sillon')).toBeTruthy()
  })
})

describe('GrooveLoader', () => {
  it('announces a wait and draws the groove', () => {
    const { container } = render(<GrooveLoader />)
    expect(screen.getByRole('status', { name: 'Loading' })).toBeTruthy()
    expect(pathOf(container).getAttribute('pathLength')).toBe('1')
  })
})
