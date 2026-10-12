// discogs.com pages holding the data Sillon shows, for the Discogs attribution

const DISCOGS = 'https://www.discogs.com'

export const discogsCollectionUrl = (username: string): string =>
  `${DISCOGS}/user/${encodeURIComponent(username)}/collection`

export const discogsWantlistUrl = (username: string): string =>
  `${DISCOGS}/wantlist?user=${encodeURIComponent(username)}`

export const discogsReleaseUrl = (releaseId: number | string): string =>
  `${DISCOGS}/release/${releaseId}`

export const discogsMasterUrl = (masterId: number | string): string =>
  `${DISCOGS}/master/${masterId}`

export const discogsArtistUrl = (artistId: number | string): string =>
  `${DISCOGS}/artist/${artistId}`

export const discogsSearchUrl = (
  q: string,
  type: 'master' | 'artist',
): string => `${DISCOGS}/search/?${new URLSearchParams({ q, type })}`
