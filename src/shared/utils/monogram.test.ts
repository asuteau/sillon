import { describe, expect, it } from 'vitest'

import { monogram } from './monogram'

describe('monogram', () => {
  it('takes the first letter of the first two words', () => {
    expect(monogram('Daft Punk')).toBe('DP')
    expect(monogram('Massive Attack Collective')).toBe('MA')
  })

  it('keeps one letter for a one-word name', () => {
    expect(monogram('Nirvana')).toBe('N')
    expect(monogram('KoЯn')).toBe('K')
  })

  it('skips a leading article', () => {
    expect(monogram('The Beatles')).toBe('B')
    expect(monogram('Les Rita Mitsouko')).toBe('RM')
    expect(monogram('Die Ärzte')).toBe('Ä')
  })

  it('keeps an article that is the whole name', () => {
    expect(monogram('The The')).toBe('T')
  })

  it('ignores a Discogs disambiguator', () => {
    expect(monogram('Nirvana (2)')).toBe('N')
  })

  it('uppercases', () => {
    expect(monogram('of montreal')).toBe('OM')
  })

  it('skips words that start with a symbol for the second letter', () => {
    expect(monogram('Simon & Garfunkel')).toBe('SG')
  })

  it('keeps a leading digit, symbol or non-Latin character as written', () => {
    expect(monogram('2Pac')).toBe('2')
    expect(monogram('!!!')).toBe('!')
    expect(monogram('坂本龍一')).toBe('坂')
    expect(monogram('Кино')).toBe('К')
  })

  it('is empty for an empty name', () => {
    expect(monogram('  ')).toBe('')
  })
})
