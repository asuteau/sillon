import { describe, expect, it } from 'vitest'

import { isStudioAlbum } from './search.utils'

describe('isStudioAlbum', () => {
  it('accepts an album', () => {
    expect(isStudioAlbum('Life Is Peachy', ['CD', 'Album', 'Stereo'])).toBe(
      true,
    )
  })

  it('rejects a master without tags', () => {
    expect(isStudioAlbum('Korn', [])).toBe(false)
  })

  it('rejects singles and EPs', () => {
    expect(isStudioAlbum('Blind', ['CD', 'Single'])).toBe(false)
  })

  it('rejects compilations', () => {
    expect(
      isStudioAlbum('Follow The Leader / Issues', [
        'CD',
        'Album',
        'Box Set',
        'Compilation',
      ]),
    ).toBe(false)
  })

  it('rejects unofficial releases', () => {
    expect(
      isStudioAlbum('Kreamed Korn', ['CD', 'Album', 'Unofficial Release']),
    ).toBe(false)
  })

  it('rejects live albums tagged as plain albums', () => {
    expect(isStudioAlbum('MTV Unplugged', ['CD', 'Album'])).toBe(false)
    expect(isStudioAlbum('Live & Rare', ['CD', 'Album'])).toBe(false)
  })

  it('does not match "live" inside a word', () => {
    expect(isStudioAlbum('Alive', ['CD', 'Album'])).toBe(true)
  })
})
