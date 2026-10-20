// @vitest-environment jsdom
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { CollectionStill } from './CollectionStill'

const renderStill = () => {
  const { container } = render(<CollectionStill />)
  const slides = [...container.querySelectorAll('.sleeve-pull-slide')]
  const distance = (slide: Element) =>
    (slide as HTMLElement).style.getPropertyValue('--pull-distance')
  const centred = slides.filter((slide) => distance(slide) === '0')
  return { container, slides, centred, distance }
}

describe('CollectionStill', () => {
  it('is the Sleeve pull pose: one centred sleeve, dimmed neighbours either side', () => {
    const { slides, centred, distance } = renderStill()
    expect(centred).toHaveLength(1)
    const index = slides.indexOf(centred[0])
    expect(index).toBeGreaterThan(0)
    expect(index).toBeLessThan(slides.length - 1)
    for (const slide of slides)
      if (slide !== centred[0]) expect(distance(slide)).toBe('1')
  })

  it('pulls the centred disc out in its Vinyl colour, not black', () => {
    const { container, centred } = renderStill()
    const discs = container.querySelectorAll('.disc')
    expect(discs).toHaveLength(1)
    const disc = centred[0].querySelector<HTMLElement>('.disc')
    expect(disc?.style.getPropertyValue('--disc-surface')).toMatch(/#|oklab/)
    expect(centred[0].closest('[data-skeleton]')).toBeNull()
    expect(centred[0].hasAttribute('data-cover-pending')).toBe(false)
  })

  it('sleeves every record in a House sleeve', () => {
    const { slides } = renderStill()
    for (const slide of slides)
      expect(slide.querySelector('[data-layout]')).not.toBeNull()
  })

  it('captions the centred record as the strip does', () => {
    const { container } = renderStill()
    const text = container.textContent
    expect(text).toContain('The Lanterne Quartet')
    expect(text).toContain('Night Ferry')
    expect(text).toMatch(/02 \/ 05 · Added 3 Sep 2026/)
  })
})
