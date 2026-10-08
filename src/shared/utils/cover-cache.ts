// Cover lookups remembered across sessions, so lists don't wait on Deezer
// every visit. Matches are kept for good; "no match" for 30 days, so a House
// sleeve gets another chance if Deezer adds the album.

// Bump with the matching algorithm: every lookup, here and in memory, is redone
export const COVER_LOOKUP_VERSION = 'v4'
const PREFIX = `sillon-cover:${COVER_LOOKUP_VERSION}:`
export const NO_MATCH_TTL_MS = 30 * 24 * 60 * 60 * 1000

interface CachedCover {
  src: string | null
  at: number
}

const isCachedCover = (value: unknown): value is CachedCover =>
  typeof value === 'object' &&
  value !== null &&
  'src' in value &&
  'at' in value &&
  (typeof value.src === 'string' || value.src === null) &&
  typeof value.at === 'number'

// Storage may be missing (SSR), blocked or full: every access is best-effort
const storage = (): Storage | null => {
  try {
    return typeof window === 'undefined' ? null : window.localStorage
  } catch {
    return null
  }
}

/** The remembered Deezer URL, null for a remembered "no match", undefined when unknown */
export const readCachedCover = (
  coverKey: string,
  now = Date.now(),
): string | null | undefined => {
  try {
    const raw = storage()?.getItem(PREFIX + coverKey)
    if (!raw) return undefined
    const cached: unknown = JSON.parse(raw)
    if (!isCachedCover(cached)) return undefined
    if (cached.src === null && now - cached.at > NO_MATCH_TTL_MS)
      return undefined
    return cached.src
  } catch {
    return undefined
  }
}

export const writeCachedCover = (
  coverKey: string,
  src: string | null,
  now = Date.now(),
): void => {
  try {
    const entry: CachedCover = { src, at: now }
    storage()?.setItem(PREFIX + coverKey, JSON.stringify(entry))
  } catch {
    // Not remembered; looked up again next session
  }
}
