export const DISCOGS_API = 'https://api.discogs.com'

export function buildOAuthHeader(params: Record<string, string>): string {
  const entries = Object.entries(params)
    .map(([k, v]) => `${k}="${v}"`)
    .join(', ')
  return `OAuth ${entries}`
}

export function oauthSignature(
  consumerSecret: string,
  tokenSecret = '',
): string {
  return `${consumerSecret}&${tokenSecret}`
}

export function nonce(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}
