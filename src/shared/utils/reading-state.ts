import type { ReadStanding } from './full-read'
import { READ_PACE_MS } from './paced-read'

// The reading state: a paced full read of a list, drawn as the groove filling
// in from the outer edge. Never a percentage.

// The groove path carries pathLength="1": 1 is undrawn, 0 is whole
export const readingDashoffset = ({
  read,
  total,
}: Pick<ReadStanding, 'read' | 'total'>): number => {
  if (total === undefined) return 1
  if (total === 0) return 0
  return 1 - Math.min(read / total, 1)
}

// From the requests left at the read's pace: an honest wait, not a percentage
export const formatTimeLeft = (
  requestsLeft: number | undefined,
): string | null => {
  if (!requestsLeft) return null
  const seconds = Math.ceil((requestsLeft * READ_PACE_MS) / 1000)
  if (seconds < 60) return `about ${seconds} s left`
  return `about ${Math.round(seconds / 60)} min left`
}
