// Discogs API terms: no Content shown more than 6 hours older than discogs.com,
// and nothing kept longer than needed. Ceiling for every Discogs query and image.
export const DISCOGS_MAX_AGE_MS = 6 * 60 * 60 * 1000
