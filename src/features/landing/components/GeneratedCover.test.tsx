// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { GeneratedCover } from './GeneratedCover'

const record = { artist: 'Juno Varga', title: 'Low Season', seed: 104_103 }

describe('GeneratedCover', () => {
  it('is typeset with the artist and title, no image', () => {
    const { container } = render(<GeneratedCover {...record} />)
    expect(screen.getByText('Juno Varga')).toBeTruthy()
    expect(screen.getByText('Low Season')).toBeTruthy()
    expect(container.querySelectorAll('img')).toHaveLength(0)
  })

  it('draws a light and a dark version, the page showing one', () => {
    const { container } = render(<GeneratedCover {...record} />)
    const [light, dark] = ['light', 'dark'].map((theme) =>
      container.querySelector<HTMLElement>(`[data-theme-art="${theme}"]`),
    )
    expect(light?.style.background).toBeTruthy()
    expect(dark?.style.background).toBeTruthy()
    expect(light?.style.background).not.toBe(dark?.style.background)
  })

  it('looks the same for the same seed, different for another', () => {
    const html = (seed: number) =>
      render(<GeneratedCover {...record} seed={seed} />).container.innerHTML
    expect(html(1)).toBe(html(1))
    expect(html(1)).not.toBe(html(2))
  })
})
