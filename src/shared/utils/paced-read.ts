// A paced full read of a Discogs list, one page after another

// One page per 1.5s: at most 40 of Discogs' 60 requests a minute, leaving
// headroom for the rest of the app
export const READ_PACE_MS = 1500

// Paced from the last page's Discogs fetch, so pages already in the cache
// (loaded by the Collection page, restored from the device) cost no wait
export const nextReadDelay = (lastFetchedAt: number, now: number) =>
  Math.max(0, lastFetchedAt + READ_PACE_MS - now)
