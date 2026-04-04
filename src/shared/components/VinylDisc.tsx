interface VinylDiscProps {
  colors: string[]
  spinning: boolean
  size?: number
}

function angleToPoint(cx: number, cy: number, r: number, deg: number) {
  const rad = (deg - 90) * (Math.PI / 180)
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

function sectorPath(
  cx: number,
  cy: number,
  r: number,
  startDeg: number,
  endDeg: number,
): string {
  const start = angleToPoint(cx, cy, r, startDeg)
  const end = angleToPoint(cx, cy, r, endDeg)
  const largeArc = endDeg - startDeg > 180 ? 1 : 0
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y} Z`
}

export function VinylDisc({ colors, spinning, size = 48 }: VinylDiscProps) {
  const r = size / 2
  const safeColors = colors.length > 0 ? colors : ['#1a1a1a']
  const isBlack = safeColors.length === 1 && safeColors[0] === '#1a1a1a'

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-hidden="true"
      className={spinning ? 'animate-spin' : undefined}
      style={{ flexShrink: 0 }}
    >
      {safeColors.length === 1 ? (
        <circle cx={r} cy={r} r={r} fill={safeColors[0]} />
      ) : (
        safeColors.map((color, i) => (
          <path
            key={i}
            d={sectorPath(
              r,
              r,
              r,
              (360 / safeColors.length) * i,
              (360 / safeColors.length) * (i + 1),
            )}
            fill={color}
          />
        ))
      )}
      <circle
        cx={r}
        cy={r}
        r={r * 0.82}
        fill="none"
        stroke="rgba(0,0,0,0.2)"
        strokeWidth={1}
      />
      <circle
        cx={r}
        cy={r}
        r={r * 0.66}
        fill="none"
        stroke="rgba(0,0,0,0.2)"
        strokeWidth={1}
      />
      <circle
        cx={r}
        cy={r}
        r={r * 0.5}
        fill="none"
        stroke="rgba(0,0,0,0.2)"
        strokeWidth={1}
      />
      <circle cx={r} cy={r} r={r * 0.28} fill="#888" />
      <circle
        cx={r}
        cy={r}
        r={r * 0.06}
        fill={isBlack ? '#333' : '#ccc'}
      />
    </svg>
  )
}
