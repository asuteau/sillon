import { describe, expect, it } from 'vitest'

import {
  isCompilation,
  isCreditedTo,
  isEp,
  isStudioAlbum,
} from './search.utils'

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
    expect(isStudioAlbum('Live At Wembley', ['CD', 'Album'])).toBe(false)
    expect(isStudioAlbum('Paris (Live)', ['CD', 'Album'])).toBe(false)
    expect(isStudioAlbum("Live In San Diego '24", ['File', 'Album'])).toBe(
      false,
    )
    expect(
      isStudioAlbum('Live! At The Star-Club In Hamburg', ['LP', 'Album']),
    ).toBe(false)
    expect(isStudioAlbum('1st Live Recordings', ['LP', 'Album'])).toBe(false)
  })

  it('rejects demos and bootlegs tagged as plain albums', () => {
    expect(isStudioAlbum('Demos Vol. 1 + Vol. 2', ['File', 'Album'])).toBe(
      false,
    )
    expect(isStudioAlbum('Bootleg Recordings 1963', ['File', 'Album'])).toBe(
      false,
    )
  })

  it('accepts titles using "live" or "demo" inside other words', () => {
    expect(isStudioAlbum('Alive', ['CD', 'Album'])).toBe(true)
    expect(isStudioAlbum('Live Forever', ['CD', 'Album'])).toBe(true)
    expect(isStudioAlbum('Love Will Live', ['CD', 'Album'])).toBe(true)
    expect(isStudioAlbum('Demon Days', ['CD', 'Album'])).toBe(true)
  })

  it('accepts soundtracks', () => {
    expect(
      isStudioAlbum('Help! (Original Motion Picture Soundtrack)', [
        'LP',
        'Album',
      ]),
    ).toBe(true)
  })
})

describe('isEp', () => {
  it('accepts an EP', () => {
    expect(isEp(['12"', 'EP'])).toBe(true)
  })

  it('is never an album too', () => {
    expect(isEp(['LP', 'Album', 'EP'])).toBe(false)
  })

  it('rejects unofficial releases', () => {
    expect(isEp(['7"', 'EP', 'Unofficial Release'])).toBe(false)
  })
})

describe('isCompilation', () => {
  it('accepts a compilation', () => {
    expect(isCompilation(['LP', 'Compilation'])).toBe(true)
  })

  it('rejects unofficial releases', () => {
    expect(isCompilation(['CD', 'Compilation', 'Unofficial Release'])).toBe(
      false,
    )
  })
})

describe('isCreditedTo', () => {
  const beatles = ['The Beatles', 'Beatles']
  const gizzard = [
    'King Gizzard And The Lizard Wizard',
    'King Gizzard & The Lizard Wizard',
    'KGLW',
  ]

  it('accepts the artist name and its variations', () => {
    expect(isCreditedTo('The Beatles', beatles)).toBe(true)
    expect(isCreditedTo('Beatles*', beatles)).toBe(true)
    expect(isCreditedTo('King Gizzard & The Lizard Wizard*', gizzard)).toBe(
      true,
    )
  })

  it('ignores the translated part of a credit', () => {
    expect(isCreditedTo('The Beatles = ビートルズ*', beatles)).toBe(true)
  })

  it('accepts splits and collaborations whatever the credit order', () => {
    expect(isCreditedTo('Tony Sheridan With The Beatles', beatles)).toBe(true)
    expect(isCreditedTo('The Beatles / The Animals', beatles)).toBe(true)
    expect(
      isCreditedTo(
        'King Gizzard & The Lizard Wizard* With Mild High Club',
        gizzard,
      ),
    ).toBe(true)
    expect(
      isCreditedTo(
        'Tropical Fuck Storm + King Gizzard & The Lizard Wizard*',
        gizzard,
      ),
    ).toBe(true)
    expect(isCreditedTo('KGLW* x GIFT (29)', gizzard)).toBe(true)
  })

  it('rejects homonyms and tribute acts', () => {
    expect(isCreditedTo('The Beatles (4)', beatles)).toBe(false)
    expect(isCreditedTo('The Beatles Revival Band', beatles)).toBe(false)
    expect(isCreditedTo('The Upbeat Beatles', beatles)).toBe(false)
  })
})
