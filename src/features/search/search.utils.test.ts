import { describe, expect, it } from 'vitest'

import { isEp, isStudioAlbum, needsVersionLookup } from './search.utils'

const main = (...formats: string[]) => ({ main: formats, others: [] })

describe('isStudioAlbum', () => {
  it('accepts an album', () => {
    expect(isStudioAlbum('Life Is Peachy', main('CD', 'Album', 'Stereo'))).toBe(
      true,
    )
  })

  it('rejects a master without tags', () => {
    expect(isStudioAlbum('Korn', main())).toBe(false)
  })

  it('rejects singles and EPs', () => {
    expect(isStudioAlbum('Blind', main('CD', 'Single'))).toBe(false)
  })

  it('rejects compilations', () => {
    expect(
      isStudioAlbum(
        'Follow The Leader / Issues',
        main('CD', 'Album', 'Box Set', 'Compilation'),
      ),
    ).toBe(false)
  })

  it('rejects unofficial releases', () => {
    expect(
      isStudioAlbum('Kreamed Korn', main('CD', 'Album', 'Unofficial Release')),
    ).toBe(false)
  })

  it('rejects live albums tagged as plain albums', () => {
    expect(isStudioAlbum('MTV Unplugged', main('CD', 'Album'))).toBe(false)
    expect(isStudioAlbum('Live At Wembley', main('CD', 'Album'))).toBe(false)
    expect(isStudioAlbum('Paris (Live)', main('CD', 'Album'))).toBe(false)
  })

  it('accepts titles using "live" as a plain word', () => {
    expect(isStudioAlbum('Alive', main('CD', 'Album'))).toBe(true)
    expect(isStudioAlbum('Live Forever', main('CD', 'Album'))).toBe(true)
    expect(isStudioAlbum('Love Will Live', main('CD', 'Album'))).toBe(true)
  })

  it('accepts an album whose main release lacks the album tag (Percepticide)', () => {
    expect(
      isStudioAlbum('Percepticide: The Death Of Reality', {
        main: ['LP', 'Limited Edition'],
        others: ['LP', 'FLAC', 'Album', 'LP', 'Stereo'],
      }),
    ).toBe(true)
  })

  it('accepts a soundtrack whose main release lacks the album tag (The Odyssey)', () => {
    expect(
      isStudioAlbum('The Odyssey (Original Motion Picture Soundtrack)', {
        main: ['FLAC'],
        others: ['LP', 'Album', 'MP3', 'Album', 'Stereo'],
      }),
    ).toBe(true)
  })

  it('lets the main release decide what kind of record it is', () => {
    expect(
      isStudioAlbum('Some EP', { main: ['12"', 'EP'], others: ['Album'] }),
    ).toBe(false)
    expect(
      isStudioAlbum('Some Comp', {
        main: ['LP', 'Compilation'],
        others: ['Album'],
      }),
    ).toBe(false)
  })

  it('ignores exclusions on releases other than the main one', () => {
    expect(
      isStudioAlbum('Classic', {
        main: ['LP', 'Album'],
        others: ['Box Set', 'Compilation'],
      }),
    ).toBe(true)
  })
})

describe('isEp', () => {
  it('accepts an EP', () => {
    expect(isEp(main('12"', 'EP'))).toBe(true)
  })

  it('falls back to other releases when the main release has neither tag', () => {
    expect(isEp({ main: ['File', 'MP3'], others: ['12"', 'EP'] })).toBe(true)
  })

  it('is never an album too', () => {
    expect(isEp({ main: ['LP', 'Album'], others: ['EP'] })).toBe(false)
    expect(isEp({ main: ['File'], others: ['Album', 'EP'] })).toBe(false)
  })
})

describe('needsVersionLookup', () => {
  it('looks up masters the name search missed', () => {
    expect(needsVersionLookup(undefined)).toBe(true)
  })

  it('looks up masters whose main release tags are inconclusive', () => {
    expect(needsVersionLookup(['Vinyl', 'LP', 'Limited Edition'])).toBe(true)
    expect(needsVersionLookup(['File', 'AAC'])).toBe(true)
  })

  it('skips masters whose main release settles the kind', () => {
    expect(needsVersionLookup(['CD', 'Album'])).toBe(false)
    expect(needsVersionLookup(['12"', 'EP'])).toBe(false)
    expect(needsVersionLookup(['File', 'Single'])).toBe(false)
    expect(needsVersionLookup(['LP', 'Compilation'])).toBe(false)
  })
})
