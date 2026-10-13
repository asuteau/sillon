import { describe, expect, it } from 'vitest'

import { discSurface } from './disc-surface.utils'
import type { VinylEffect } from './vinyl-colour.utils'
import { vinylColour } from './vinyl-colour.utils'

const surfaceOf = (text?: string, seed = 1, descriptions?: string[]) =>
  discSurface(
    vinylColour([{ name: 'Vinyl', qty: '1', text, descriptions }]),
    seed,
  )

const BLACK = surfaceOf().background

describe('discSurface', () => {
  it('is plain black vinyl when the note names nothing', () => {
    expect(surfaceOf()).toEqual({
      background: '#0a0a0b',
      seeThrough: false,
      picture: false,
    })
  })

  it('is the colour itself for solid vinyl', () => {
    expect(surfaceOf('Red').background).toBe('#c8202a')
  })

  it('lets the page show through translucent and clear vinyl', () => {
    for (const text of ['Clear', 'Blue Translucent', 'Coke Bottle Clear']) {
      const surface = surfaceOf(text)
      expect(surface.seeThrough, text).toBe(true)
      expect(surface.background, text).toMatch(/transparent\)$/)
    }
    // A clear half still needs its edge
    expect(surfaceOf('Red / Clear Split').seeThrough).toBe(true)
    expect(surfaceOf('Red').seeThrough).toBe(false)
  })

  it('draws every effect the parser returns, none of them black', () => {
    const notes: Record<VinylEffect, string> = {
      solid: 'Green',
      splatter: 'Yellow / Black Splatter',
      marbled: 'Violet Marbled',
      split: 'Yellow / Red Split',
      corona: 'Black With Orange Corona',
      'ink-spot': 'Black & Red Ink Spot',
      propeller: 'Red/Yellow/Green Tri-Color',
      twister: 'Red / White Twister',
      yolk: 'Clear With Black Yolk',
      etched: 'Side D Etched',
      'split-splatter': 'Red / Blue Split With White Splatter',
      'yolk-splatter': 'Blue Yolk-In-Clear With Pink And White Splatter',
      'marbled-splatter': 'Purple Marbled With Black Splatter',
    }
    const backgrounds = Object.entries(notes).map(([effect, text]) => {
      expect(vinylColour([{ name: 'Vinyl', qty: '1', text }]).effect).toBe(
        effect,
      )
      return surfaceOf(text).background
    })
    for (const background of backgrounds) expect(background).not.toBe(BLACK)
    expect(new Set(backgrounds).size).toBe(backgrounds.length)
  })

  it('splatters each named colour over the base', () => {
    const background = surfaceOf('Clear w/ Black & White Splatter').background
    expect(background).toContain('#0a0a0b')
    expect(background).toContain('#f2f0ea')
    // The base, see-through, lies under the dots
    expect(background).toMatch(
      /color-mix\(in oklab, #e9eef0 [\d.]+%, transparent\)$/,
    )
  })

  it('splatters the hybrid’s own colours, the effect keeping the first', () => {
    const background = surfaceOf(
      'Red / Blue Split With White Splatter',
    ).background
    const [splatter, split] = [
      background.lastIndexOf('#f2f0ea'),
      background.indexOf('linear-gradient'),
    ]
    expect(splatter).toBeGreaterThan(-1)
    // Dots above the split
    expect(splatter).toBeLessThan(split)
    expect(background.slice(split)).toContain('#c8202a')
    expect(background.slice(split)).toContain('#2257c4')
    expect(background.slice(split)).not.toContain('#f2f0ea')
  })

  it('keeps a two-colour split whole when the splatter names no colour', () => {
    const background = surfaceOf('Red / Blue Split Splatter').background
    const split = background.slice(background.indexOf('linear-gradient'))
    expect(split).toContain('#c8202a')
    expect(split).toContain('#2257c4')
  })

  it('looks the same for the same Release every time, different for another', () => {
    const note = 'Yellow / Black Splatter'
    expect(surfaceOf(note, 42)).toEqual(surfaceOf(note, 42))
    expect(surfaceOf(note, 42).background).not.toBe(
      surfaceOf(note, 43).background,
    )
  })

  it('lays the materials over the colour', () => {
    const red = surfaceOf('Red').background
    for (const text of ['Red Sparkle', 'Red Pearl', 'Red Glow In The Dark']) {
      const background = surfaceOf(text).background
      expect(background, text).not.toBe(red)
      expect(background, text).toMatch(/, #c8202a$/)
    }
  })

  it('puts the Cover on a picture disc', () => {
    expect(surfaceOf('', 1, ['LP', 'Picture Disc']).picture).toBe(true)
    expect(surfaceOf('Red').picture).toBe(false)
  })
})
