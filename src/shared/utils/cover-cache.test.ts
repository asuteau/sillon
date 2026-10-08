// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'

import {
  NO_MATCH_TTL_MS,
  readCachedCover,
  writeCachedCover,
} from './cover-cache'

const NOW = 1_700_000_000_000

describe('cover cache', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('knows nothing about a Cover never looked up', () => {
    expect(readCachedCover('m:1', NOW)).toBeUndefined()
  })

  it('remembers a match for good', () => {
    writeCachedCover('m:1', 'https://deezer/hd.jpg', NOW)
    expect(readCachedCover('m:1', NOW + 10 * NO_MATCH_TTL_MS)).toBe(
      'https://deezer/hd.jpg',
    )
  })

  it('remembers "no match" for 30 days only', () => {
    writeCachedCover('m:1', null, NOW)
    expect(readCachedCover('m:1', NOW + NO_MATCH_TTL_MS)).toBeNull()
    expect(readCachedCover('m:1', NOW + NO_MATCH_TTL_MS + 1)).toBeUndefined()
  })

  it('ignores a corrupt entry', () => {
    window.localStorage.setItem('sillon-cover:v4:m:1', '{not json')
    expect(readCachedCover('m:1', NOW)).toBeUndefined()
    window.localStorage.setItem('sillon-cover:v4:m:1', '{"src":1,"at":0}')
    expect(readCachedCover('m:1', NOW)).toBeUndefined()
  })
})
