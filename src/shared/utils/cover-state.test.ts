import { describe, expect, it } from 'vitest'

import { coverState } from './cover-state'

const base = {
  hdSettled: false,
  hdSrc: null,
  hdFailed: false,
}

describe('coverState', () => {
  it('is loading while the Deezer lookup is pending', () => {
    expect(coverState(base)).toBe('loading')
  })

  it('shows the image when Deezer matched', () => {
    expect(
      coverState({ ...base, hdSettled: true, hdSrc: 'https://img/hd.jpg' }),
    ).toBe('image')
  })

  it('falls back to a house sleeve when Deezer has no match', () => {
    expect(coverState({ ...base, hdSettled: true })).toBe('house')
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
