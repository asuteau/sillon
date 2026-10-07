import { describe, expect, it } from 'vitest'

import { coverState } from './cover-state'

const base = {
  thumb: null,
  thumbFailed: false,
  hdSettled: false,
  hdSrc: null,
  hdFailed: false,
}

describe('coverState', () => {
  it('is loading while the HD lookup is pending and there is no thumb', () => {
    expect(coverState(base)).toBe('loading')
  })

  it('shows the image as soon as there is a thumb', () => {
    expect(coverState({ ...base, thumb: 'https://img/t.jpg' })).toBe('image')
  })

  it('shows the image when only HD matched', () => {
    expect(
      coverState({ ...base, hdSettled: true, hdSrc: 'https://img/hd.jpg' }),
    ).toBe('image')
  })

  it('falls back to a house sleeve with no thumb and no HD match', () => {
    expect(coverState({ ...base, hdSettled: true })).toBe('house')
  })

  it('treats an empty or broken thumb as missing', () => {
    expect(coverState({ ...base, thumb: '', hdSettled: true })).toBe('house')
    expect(
      coverState({
        ...base,
        thumb: 'https://img/t.jpg',
        thumbFailed: true,
        hdSettled: true,
      }),
    ).toBe('house')
  })

  it('treats a broken HD image as missing', () => {
    expect(
      coverState({
        ...base,
        hdSettled: true,
        hdSrc: 'https://img/hd.jpg',
        hdFailed: true,
      }),
    ).toBe('house')
  })
})
