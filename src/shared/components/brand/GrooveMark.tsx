import { useId } from 'react'

import { cn } from '#/shared/utils/cn'
import {
  GROOVE_INNER_RADIUS,
  GROOVE_OUTER_RADIUS,
  grooveSpiralPath,
  grooveStrokeWidth,
  grooveTurnsForSize,
} from '#/shared/utils/groove-spiral'

export type GrooveTone = 'lacquer' | 'current'

interface GrooveMarkProps {
  /** Rendered size in px; also sets the turns and stroke width */
  size: number
  /** `lacquer` only on brand moments (icon, splash); `current` follows text colour */
  tone?: GrooveTone
  /** Accessible name; omit when the mark is decorative */
  label?: string
  className?: string
}

export const GrooveMark = ({
  size,
  tone = 'current',
  label,
  className,
}: GrooveMarkProps) => {
  const gradientId = useId()
  const d = grooveSpiralPath({
    turns: grooveTurnsForSize(size),
    innerRadius: GROOVE_INNER_RADIUS,
    outerRadius: GROOVE_OUTER_RADIUS,
  })

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={cn('shrink-0', className)}
      {...(label
        ? { role: 'img', 'aria-label': label }
        : { 'aria-hidden': true })}
    >
      {tone === 'lacquer' && (
        // Same stops as --lacquer in styles.css
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0.2" x2="1" y2="0.8">
            <stop offset="0" style={{ stopColor: 'var(--lacquer-1)' }} />
            <stop offset="0.6" style={{ stopColor: 'var(--lacquer-2)' }} />
            <stop offset="1" style={{ stopColor: 'var(--lacquer-3)' }} />
          </linearGradient>
        </defs>
      )}
      <path
        d={d}
        pathLength={1}
        fill="none"
        stroke={tone === 'lacquer' ? `url(#${gradientId})` : 'currentColor'}
        strokeWidth={grooveStrokeWidth(size).toFixed(2)}
        strokeLinecap="round"
      />
    </svg>
  )
}
