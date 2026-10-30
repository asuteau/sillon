import { useRollingCount } from '#/shared/hooks/use-rolling-count'
import { cn } from '#/shared/utils/cn'
import type { ReadStanding } from '#/shared/utils/full-read'
import type { ListName } from '#/shared/utils/list-name'
import {
  GROOVE_INNER_RADIUS,
  GROOVE_OUTER_RADIUS,
  grooveSpiralPath,
  grooveStrokeWidth,
  grooveTurnsForSize,
} from '#/shared/utils/groove-spiral'
import { formatTimeLeft, readingDashoffset } from '#/shared/utils/reading-state'

const SIZES = { large: 168, small: 30 } as const

interface ReadingStateProps extends ReadStanding {
  list: ListName
  /** Large centred in a page; small beside its readout (picker sheet, Portrait) */
  size?: keyof typeof SIZES
  className?: string
}

const formatCount = (read: number, total: number) =>
  `${read.toLocaleString()} of ${total.toLocaleString()}`

// A paced full read of a list: the groove fills in from the outer edge as
// records are read, closing exactly when the list is whole. Fades in after
// the router's pending delay, so a list read in one request never flashes it.
export const ReadingState = ({
  list,
  read,
  total,
  requestsLeft,
  size = 'large',
  className,
}: ReadingStateProps) => {
  const label = `Reading your ${list}`
  const shownRead = useRollingCount(read)
  const timeLeft = formatTimeLeft(requestsLeft)
  const isLarge = size === 'large'

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={total === undefined ? undefined : read}
      aria-valuetext={
        total === undefined ? undefined : formatCount(read, total)
      }
      className={cn(
        'reading-state flex items-center text-foreground',
        isLarge ? 'flex-col gap-6 text-center' : 'gap-3',
        className,
      )}
    >
      <ReadingGroove
        px={SIZES[size]}
        offset={readingDashoffset({ read, total })}
      />
      <div aria-hidden className="flex flex-col gap-1">
        <span className="type-caps text-[11px] text-muted-foreground">
          {label}
        </span>
        {/* One line beside the small groove, stacked under the large one */}
        <div
          className={cn(
            'flex',
            isLarge ? 'flex-col items-center gap-1' : 'items-baseline gap-3',
          )}
        >
          {total !== undefined && (
            <span className="type-catalogue text-sm tabular-nums">
              {formatCount(shownRead, total)}
            </span>
          )}
          {timeLeft && (
            <span className="type-catalogue text-xs text-muted-foreground">
              {timeLeft}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

interface ReadingGrooveProps {
  px: number
  /** stroke-dashoffset on a pathLength="1" path: 1 undrawn, 0 whole */
  offset: number
}

// The groove over a faint full track of itself, in currentColor
const ReadingGroove = ({ px, offset }: ReadingGrooveProps) => {
  const d = grooveSpiralPath({
    turns: grooveTurnsForSize(px),
    innerRadius: GROOVE_INNER_RADIUS,
    outerRadius: GROOVE_OUTER_RADIUS,
  })
  const strokeWidth = grooveStrokeWidth(px).toFixed(2)

  return (
    <svg
      aria-hidden
      viewBox="0 0 100 100"
      width={px}
      height={px}
      className="shrink-0"
    >
      <path
        d={d}
        fill="none"
        stroke="currentColor"
        strokeOpacity={0.14}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <path
        data-reading-groove
        className="reading-groove"
        d={d}
        pathLength={1}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={1}
        // Hidden while undrawn: a round cap would leave a dot
        visibility={offset >= 1 ? 'hidden' : undefined}
        style={{ strokeDashoffset: offset }}
      />
    </svg>
  )
}
