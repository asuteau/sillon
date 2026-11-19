import { describe, expect, it } from 'vitest'

import { countDigits } from './count-digits'

describe('countDigits', () => {
  it('shows every digit still when the count is unchanged', () => {
    expect(countDigits(12, 12)).toEqual([
      { digit: '1', from: undefined },
      { digit: '2', from: undefined },
    ])
  })

  it('marks only the digits that changed, with the one they replace', () => {
    expect(countDigits(12, 13)).toEqual([
      { digit: '1', from: undefined },
      { digit: '3', from: '2' },
    ])
  })

  it('carries across columns', () => {
    expect(countDigits(99, 100)).toEqual([
      { digit: '1', from: '' },
      { digit: '0', from: '9' },
      { digit: '0', from: '9' },
    ])
  })

  it('drops a column when the count shrinks', () => {
    expect(countDigits(100, 99)).toEqual([
      { digit: '', from: '1' },
      { digit: '9', from: '0' },
      { digit: '9', from: '0' },
    ])
  })
})
