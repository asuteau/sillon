import { describe, expect, it } from 'vitest'

import { formatTimeLeft, readingDashoffset } from './reading-state'

describe('readingDashoffset', () => {
  it('leaves the groove undrawn before the record count is known', () => {
    expect(readingDashoffset({ read: 0, total: undefined })).toBe(1)
  })

  it('draws the share of records read', () => {
    expect(readingDashoffset({ read: 1200, total: 4000 })).toBeCloseTo(0.7)
  })

  it('closes exactly when every record is read', () => {
    expect(readingDashoffset({ read: 4000, total: 4000 })).toBe(0)
  })

  it('never draws past the whole groove', () => {
    expect(readingDashoffset({ read: 4100, total: 4000 })).toBe(0)
  })

  it('treats an empty list as whole', () => {
    expect(readingDashoffset({ read: 0, total: 0 })).toBe(0)
  })
})

describe('formatTimeLeft', () => {
  it('counts the paced requests left, in seconds', () => {
    // 3 requests at one per 1.5s
    expect(formatTimeLeft(3)).toBe('about 5 s left')
  })

  it('stays in seconds under a minute', () => {
    expect(formatTimeLeft(39)).toBe('about 59 s left')
  })

  it('turns to minutes from a minute on', () => {
    expect(formatTimeLeft(40)).toBe('about 1 min left')
    expect(formatTimeLeft(150)).toBe('about 4 min left')
  })

  it('says nothing once no request is left, or before it is known', () => {
    expect(formatTimeLeft(0)).toBeNull()
    expect(formatTimeLeft(undefined)).toBeNull()
  })
})
