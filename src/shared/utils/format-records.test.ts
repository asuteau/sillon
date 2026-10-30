import { describe, expect, it } from 'vitest'

import { formatRecords } from './format-records'

describe('formatRecords', () => {
  it('says record for one, records otherwise', () => {
    expect(formatRecords(1)).toBe('1 record')
    expect(formatRecords(0)).toBe('0 records')
    expect(formatRecords(2140)).toBe(`${(2140).toLocaleString()} records`)
  })
})
