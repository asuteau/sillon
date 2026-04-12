interface RateLimit {
  limit: number
  used: number
  remaining: number
  updatedAt: number
}

let lastRateLimit: RateLimit | null = null

/**
 * Drop-in replacement for fetch() when calling the Discogs API.
 * Extracts rate limit headers from the response and stores them
 * server-side so they can be retrieved by getDiscogsRateLimit.
 */
export async function discogsRequest(
  url: string,
  init?: RequestInit,
): Promise<Response> {
  const response = await fetch(url, init)

  const limit = response.headers.get('X-Discogs-Ratelimit')
  const used = response.headers.get('X-Discogs-Ratelimit-Used')
  const remaining = response.headers.get('X-Discogs-Ratelimit-Remaining')

  if (limit && used && remaining) {
    lastRateLimit = {
      limit: parseInt(limit, 10),
      used: parseInt(used, 10),
      remaining: parseInt(remaining, 10),
      updatedAt: Date.now(),
    }
  }

  return response
}

export function getLastRateLimit() {
  return lastRateLimit
}
