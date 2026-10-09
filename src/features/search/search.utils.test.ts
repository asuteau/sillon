import { describe, expect, it } from 'vitest'

import { isCompilation, isEp, isStudioAlbum, readCredit } from './search.utils'

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

describe('readCredit', () => {
  const beatles = { name: 'The Beatles', variations: ['Beatles'] }
  const gizzard = {
    name: 'King Gizzard And The Lizard Wizard',
    variations: ['King Gizzard & The Lizard Wizard', 'KGLW'],
  }
  const korn = { name: 'Korn', variations: ['KoЯn'] }
  const telepath = {
    name: 'Telepath テレパシー能力者',
    variations: ['Telepath', 't e l e p a t h テレパシー能力者'],
  }

  it('credits the artist name and its starred variations', () => {
    expect(readCredit('The Beatles', beatles)).toBe('credited')
    expect(readCredit('Beatles*', beatles)).toBe('credited')
    expect(readCredit('King Gizzard & The Lizard Wizard*', gizzard)).toBe(
      'credited',
    )
    expect(readCredit('t e l e p a t h テレパシー能力者*', telepath)).toBe(
      'credited',
    )
  })

  it('ignores the translated part of a credit', () => {
    expect(readCredit('The Beatles = ビートルズ*', beatles)).toBe('credited')
  })

  it('leaves splits and collaborations unclear, whatever the credit order', () => {
    expect(readCredit('Tony Sheridan With The Beatles', beatles)).toBe(
      'unclear',
    )
    expect(readCredit('The Beatles / The Animals', beatles)).toBe('unclear')
    expect(
      readCredit(
        'King Gizzard & The Lizard Wizard* With Mild High Club',
        gizzard,
      ),
    ).toBe('unclear')
    expect(
      readCredit(
        'Tropical Fuck Storm + King Gizzard & The Lizard Wizard*',
        gizzard,
      ),
    ).toBe('unclear')
    expect(readCredit('KGLW* x GIFT (29)', gizzard)).toBe('unclear')
  })

  it('leaves names that contain the artist name unclear', () => {
    expect(readCredit('Schöner Sterben Mit Heroin & Korn', korn)).toBe(
      'unclear',
    )
  })

  it('leaves an unstarred variation unclear: it may be another artist', () => {
    expect(readCredit('Telepath', telepath)).toBe('unclear')
  })

  it('rejects homonyms and tribute acts', () => {
    expect(readCredit('The Beatles (4)', beatles)).toBe('uncredited')
    expect(readCredit('The Beatles Revival Band', beatles)).toBe('uncredited')
    expect(readCredit('The Upbeat Beatles', beatles)).toBe('uncredited')
    expect(readCredit('Telepath (4)', telepath)).toBe('uncredited')
  })
})
