// @vitest-environment jsdom
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { grooveSpiralPath } from '#/shared/utils/groove-spiral'

import { CollectionIcon } from './CollectionIcon'
import { FulfilledWantIcon } from './FulfilledWantIcon'
import { HomeIcon } from './HomeIcon'
import { RandomPickIcon } from './RandomPickIcon'
import { ScanIcon } from './ScanIcon'
import { SearchIcon } from './SearchIcon'
import { WantlistIcon } from './WantlistIcon'

const ICONS = [
  ['Home', HomeIcon],
  ['Collection', CollectionIcon],
  ['Wantlist', WantlistIcon],
  ['FulfilledWant', FulfilledWantIcon],
  ['Scan', ScanIcon],
  ['RandomPick', RandomPickIcon],
  ['Search', SearchIcon],
] as const

const svgOf = (container: HTMLElement) => {
  const svg = container.querySelector('svg')
  if (!svg) throw new Error('no svg rendered')
  return svg
}

describe.each(ICONS)('%s icon', (_, Icon) => {
  it('draws on a 24px grid in the groove line language', () => {
    const svg = svgOf(render(<Icon />).container)
    expect(svg.getAttribute('viewBox')).toBe('0 0 24 24')
    expect(svg.getAttribute('fill')).toBe('none')
    expect(svg.getAttribute('stroke')).toBe('currentColor')
    expect(svg.getAttribute('stroke-width')).toBe('1.5')
    expect(svg.getAttribute('stroke-linecap')).toBe('round')
    expect(svg.getAttribute('stroke-linejoin')).toBe('round')
    expect(svg.childElementCount).toBeGreaterThan(0)
  })

  it('defaults to 24px and takes a size like lucide', () => {
    const svg = svgOf(render(<Icon />).container)
    expect(svg.getAttribute('width')).toBe('24')
    expect(svg.getAttribute('height')).toBe('24')

    const sized = svgOf(render(<Icon size={18} />).container)
    expect(sized.getAttribute('width')).toBe('18')
    expect(sized.getAttribute('height')).toBe('18')
  })

  it('passes className through', () => {
    const svg = svgOf(render(<Icon className="size-4 text-x" />).container)
    expect(svg.getAttribute('class')).toContain('size-4 text-x')
  })

  it('is hidden from assistive tech unless labelled', () => {
    const svg = svgOf(render(<Icon />).container)
    expect(svg.getAttribute('aria-hidden')).toBe('true')

    const labelled = svgOf(render(<Icon aria-label="Go" />).container)
    expect(labelled.hasAttribute('aria-hidden')).toBe(false)
    expect(labelled.getAttribute('aria-label')).toBe('Go')
    expect(labelled.getAttribute('role')).toBe('img')
  })
})

describe('HomeIcon', () => {
  it('is the groove mark, drawn by the shared spiral helper', () => {
    const { container } = render(<HomeIcon />)
    expect(container.querySelector('path')?.getAttribute('d')).toBe(
      grooveSpiralPath({
        turns: 2.5,
        innerRadius: 1,
        outerRadius: 9.5,
        centre: { x: 12, y: 12 },
      }),
    )
  })
})
