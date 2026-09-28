// A Cover belongs to the Master; a Release without a Master has its own.
// Prefixed because Discogs master and release ids are separate id spaces.
export const masterCoverKey = (masterId: number | string): string =>
  `master:${masterId}`

export const releaseCoverKey = (
  releaseId: number | string,
  masterId?: number | null,
): string => (masterId ? masterCoverKey(masterId) : `release:${releaseId}`)
