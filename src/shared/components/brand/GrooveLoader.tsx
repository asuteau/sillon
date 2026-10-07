import { cn } from '#/shared/utils/cn'

import { GrooveMark } from './GrooveMark'
import type { GrooveTone } from './GrooveMark'

interface GrooveLoaderProps {
  size?: number
  tone?: GrooveTone
  className?: string
}

// Only for real waits (cold start, long fetch) — never as an added delay.
// Draw-in and reduced-motion fallback live in styles.css (.groove-loader).
export const GrooveLoader = ({
  size = 96,
  tone = 'current',
  className,
}: GrooveLoaderProps) => (
  <div
    role="status"
    aria-label="Loading"
    className={cn('groove-loader', className)}
  >
    <GrooveMark size={size} tone={tone} />
  </div>
)
