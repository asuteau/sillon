import { useQuery } from '@tanstack/react-query'

import { getDiscogsRateLimit } from '#/services/discogs.api'

/**
 * Dev-only indicator showing Discogs API rate limit status.
 * Renders nothing in production builds.
 */
export function DiscogsRateLimitDevTools() {
  if (!import.meta.env.DEV) return null
  return <DiscogsRateLimitDevToolsInner />
}

function DiscogsRateLimitDevToolsInner() {
  const { data } = useQuery({
    queryKey: ['discogs', 'rateLimit'],
    queryFn: () => getDiscogsRateLimit(),
    refetchInterval: 3000,
  })

  if (!data) return null

  const pct = data.used / data.limit
  const color = pct < 0.5 ? '#22c55e' : pct < 0.8 ? '#eab308' : '#ef4444'

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '80px',
        right: '16px',
        backgroundColor: 'rgba(10, 10, 15, 0.92)',
        border: `1px solid ${color}`,
        borderRadius: '6px',
        padding: '8px 12px',
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#fff',
        zIndex: 9999,
        minWidth: '168px',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          color,
          fontWeight: 'bold',
          marginBottom: '4px',
          letterSpacing: '0.06em',
        }}
      >
        DISCOGS API
      </div>
      <div style={{ marginBottom: '6px', color: 'rgba(255,255,255,0.85)' }}>
        {data.used}/{data.limit} · {data.remaining} remaining
      </div>
      <div
        style={{
          height: '3px',
          backgroundColor: 'rgba(255,255,255,0.12)',
          borderRadius: '2px',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${Math.min(Math.round(pct * 100), 100)}%`,
            backgroundColor: color,
            borderRadius: '2px',
            transition: 'width 0.3s ease',
          }}
        />
      </div>
    </div>
  )
}
