import { describe, expect, it } from 'vitest'

import {
  centredAfterChange,
  nearestSlide,
  platterEase,
  pullDistance,
  slidePosition,
} from './sleeve-pull.utils'

describe('pullDistance', () => {
  it('is 0 for the centred slide, so its disc is fully out', () => {
    expect(
      pullDistance({ slideCentre: 500, stripCentre: 500, step: 400 }),
    ).toBe(0)
  })

  it('grows with the distance to the centre, either side', () => {
    expect(
      pullDistance({ slideCentre: 600, stripCentre: 500, step: 400 }),
    ).toBe(0.25)
    expect(
      pullDistance({ slideCentre: 300, stripCentre: 500, step: 400 }),
    ).toBe(0.5)
  })

  it('stops at 1 from one slide away', () => {
    expect(
      pullDistance({ slideCentre: 1700, stripCentre: 500, step: 400 }),
    ).toBe(1)
  })
})

describe('nearestSlide', () => {
  it('is the slide whose centre is closest to the strip centre', () => {
    expect(nearestSlide([200, 600, 1000], 640)).toBe(1)
    expect(nearestSlide([200, 600, 1000], 900)).toBe(2)
  })

  it('keeps the first of two equally near slides', () => {
    expect(nearestSlide([200, 600], 400)).toBe(0)
  })
})

describe('slidePosition', () => {
  it('numbers the centred record out of the strip, two digits each', () => {
    expect(slidePosition(2, 10)).toBe('03 / 10')
    expect(slidePosition(0, 1)).toBe('01 / 01')
  })
})

describe('centredAfterChange', () => {
  it('slides the next older record into the centre when the centred one is removed', () => {
    expect(
      centredAfterChange({
        ids: [1, 2, 4, 5, 11],
        centredId: 3,
        centredIndex: 2,
      }),
    ).toBe(2)
  })

  it('falls back to the previous record when the last one is removed', () => {
    expect(
      centredAfterChange({ ids: [1, 2], centredId: 3, centredIndex: 2 }),
    ).toBe(1)
  })

  it('has nothing to centre once the Collection is empty', () => {
    expect(
      centredAfterChange({ ids: [], centredId: 1, centredIndex: 0 }),
    ).toBeNull()
  })

  it('follows the centred record when another one moves it', () => {
    expect(
      centredAfterChange({ ids: [9, 1, 2, 3], centredId: 2, centredIndex: 1 }),
    ).toBe(2)
  })
})

describe('platterEase', () => {
  it('starts and ends in place', () => {
    expect(platterEase(0)).toBe(0)
    expect(platterEase(1)).toBe(1)
  })

  it('follows --ease-platter, cubic-bezier(.65, 0, .15, 1)', () => {
    expect(platterEase(0.25)).toBeCloseTo(0.0821, 3)
    expect(platterEase(0.5)).toBeCloseTo(0.7258, 3)
    expect(platterEase(0.75)).toBeCloseTo(0.961, 3)
  })
})
