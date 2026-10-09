import { describe, expect, it } from 'vitest'

import { creditNames, recordCredits } from './artist-name'

describe('creditNames', () => {
  it('splits a collaboration, Lead credit first, as printed', () => {
    expect(creditNames('Nmesh And t e l e p a t h テレパシー能力者*')).toEqual([
      'Nmesh',
      't e l e p a t h テレパシー能力者',
    ])
  })

  it('drops disambiguators and the translated credit', () => {
    expect(creditNames('The Beatles (4) = ビートルズ*')).toEqual([
      'The Beatles',
    ])
    expect(creditNames('Ben Wheeler (6), Agia')).toEqual([
      'Ben Wheeler',
      'Agia',
    ])
  })
})

describe('recordCredits', () => {
  it('lists names as printed, then the canonical names they stand for', () => {
    expect(
      recordCredits([
        { name: 'Telepath テレパシー能力者', anv: 't e l e p a t h' },
        { name: 'Hong Kong Express (2)', anv: '' },
      ]),
    ).toEqual([
      't e l e p a t h',
      'Hong Kong Express',
      'Telepath テレパシー能力者',
    ])
  })
})
