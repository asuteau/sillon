import { useId } from 'react'
import type { ReactNode } from 'react'

import { cn } from '#/shared/utils/cn'

import { formatRecords, leaderCount } from '../portrait.utils'

export interface TimeEntry {
  key: number
  /** The decade or year, as read aloud and on the axis */
  label: string
  count: number
}

interface TimeChartProps {
  title: string
  /** Oldest first, gaps included as zero */
  entries: TimeEntry[]
  /** A line under the chart, e.g. Copies left out */
  note?: ReactNode
}

// Past this, columns are too narrow at phone width (~40px) for every count
// and label ("1990s" in 10px mono is ~30px)
const MAX_LABELLED = 8
const MAX_TICKS = 6

// Hand-built vertical bars on a hairline baseline; an empty step stays as an
// empty bar. Leaders get a copper column and a full-strength count. Read as a
// list of values; the bars draw up on reveal (fade under reduced motion).
export const TimeChart = ({ title, entries, note }: TimeChartProps) => {
  const titleId = useId()
  const top = Math.max(1, ...entries.map((entry) => entry.count))
  const leader = leaderCount(entries.map((entry) => entry.count))
  const isCrowded = entries.length > MAX_LABELLED
  // Anchored on the newest step, so the current year always carries a label
  const tickStep = Math.ceil(entries.length / MAX_TICKS)
  const hasTick = (index: number) =>
    !isCrowded || (entries.length - 1 - index) % tickStep === 0

  return (
    <section aria-labelledby={titleId} className="portrait-reveal mt-14">
      <h2
        id={titleId}
        className="type-caps mb-5 text-[11px] text-muted-foreground"
      >
        {title}
      </h2>
      {entries.length > 0 && (
        <ol
          aria-labelledby={titleId}
          className="m-0 flex list-none gap-1 p-0 sm:gap-2"
        >
          {entries.map((entry, index) => {
            const isLeader = entry.count === leader
            return (
              <li key={entry.key} className="flex min-w-0 flex-1 flex-col">
                <span className="sr-only">{`${entry.label}: ${formatRecords(entry.count)}`}</span>
                <div
                  aria-hidden
                  className="flex h-32 flex-col items-center justify-end gap-1 border-b border-border"
                >
                  {(!isCrowded || entry.count === top) && (
                    <span
                      className={cn(
                        'type-catalogue text-[10px] leading-3',
                        isLeader ? 'text-foreground' : 'text-muted-foreground',
                      )}
                    >
                      {entry.count.toLocaleString()}
                    </span>
                  )}
                  <span
                    className={cn(
                      'portrait-column block w-full max-w-8',
                      isLeader
                        ? 'bg-(--lacquer-2)'
                        : entry.count > 0
                          ? 'bg-foreground/80'
                          : // An empty bar: a stub on the baseline, not a gap
                            'bg-muted-foreground/40',
                    )}
                    // Room left above the tallest bar for its count
                    style={{
                      height:
                        entry.count > 0
                          ? `calc((100% - 1rem) * ${entry.count / top})`
                          : '2px',
                    }}
                  />
                </div>
                <span
                  aria-hidden
                  // Centred even when wider than its column
                  className="type-catalogue mt-1.5 flex h-3 justify-center text-[10px] leading-3 whitespace-nowrap text-muted-foreground"
                >
                  {hasTick(index) ? entry.label : ''}
                </span>
              </li>
            )
          })}
        </ol>
      )}
      {note && (
        <p className="type-catalogue mt-4 text-xs text-muted-foreground">
          {note}
        </p>
      )}
    </section>
  )
}
