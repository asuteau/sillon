import { describe, expect, it } from 'vitest'

import * as collection from '#/features/collection/collection.queries'
import * as marketplace from '#/features/marketplace/marketplace.queries'
import * as profile from '#/features/profile/profile.queries'
import * as search from '#/features/search/search.queries'
import * as wantlist from '#/features/wantlist/wantlist.queries'

import { DISCOGS_MAX_AGE_MS } from './discogs-freshness'

// Covers come from Deezer, which sets no age limit
const NOT_DISCOGS = new Set(['coverArtQueryOptions', 'coverTintQueryOptions'])

// Default gcTime is 5 minutes; staleTime defaults to 0
const DEFAULT_GC_TIME_MS = 5 * 60 * 1000

interface TimedOptions {
  staleTime?: unknown
  gcTime?: unknown
}

// Every exported *QueryOptions, called with placeholder arguments: only the
// options are read, nothing is fetched
const discogsQueryOptions = Object.entries({
  ...collection,
  ...marketplace,
  ...profile,
  ...search,
  ...wantlist,
})
  .filter(([name]) => name.endsWith('QueryOptions') && !NOT_DISCOGS.has(name))
  .map(([name, value]): [string, TimedOptions] => [
    name,
    typeof value === 'function'
      ? (value as (...args: unknown[]) => TimedOptions)('x', null)
      : (value as TimedOptions),
  ])

describe('Discogs freshness ceiling', () => {
  it('finds the Discogs queries', () => {
    expect(discogsQueryOptions.length).toBeGreaterThanOrEqual(10)
  })

  it.each(discogsQueryOptions)(
    '%s keeps data no longer than 6 hours',
    (_, options) => {
      const staleTime = options.staleTime ?? 0
      const gcTime = options.gcTime ?? DEFAULT_GC_TIME_MS
      expect(typeof staleTime).toBe('number')
      expect(staleTime).toBeLessThanOrEqual(DISCOGS_MAX_AGE_MS)
      expect(gcTime).toBeLessThanOrEqual(DISCOGS_MAX_AGE_MS)
    },
  )
})
