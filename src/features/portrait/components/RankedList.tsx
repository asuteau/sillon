import { useId } from 'react'
import type { ReactNode } from 'react'

import { cn } from '#/shared/utils/cn'

export interface RankedEntry {
  key: string | number
  /** The name, or a link holding it */
  label: ReactNode
  count: number
}

interface RankedListProps {
  title: string
  /** Most Copies first: bars are drawn against the first entry */
  entries: RankedEntry[]
}

const formatRank = (index: number) => String(index + 1).padStart(2, '0')

// Typeset ranked rows: rank, name, count, and a bar against the top entry.
// The leader is set large on a copper bar, the one lacquer moment here; the
// bars draw in on reveal (fade under reduced motion).
export const RankedList = ({ title, entries }: RankedListProps) => {
  const titleId = useId()
  const top = entries[0]?.count ?? 1

  return (
    <section aria-labelledby={titleId} className="portrait-reveal mt-14">
      <h2
        id={titleId}
        className="type-caps mb-5 text-[11px] text-muted-foreground"
      >
        {title}
      </h2>
      <ol className="m-0 flex list-none flex-col gap-4 p-0">
        {entries.map((entry, index) => {
          const isLeader = index === 0
          return (
            <li
              key={entry.key}
              className={cn(
                'grid grid-cols-[2rem_1fr] items-baseline',
                isLeader && 'mb-2',
              )}
            >
              <span
                aria-hidden
                className="type-catalogue text-[11px] text-muted-foreground"
              >
                {formatRank(index)}
              </span>
              <div className="flex min-w-0 flex-col gap-2">
                <div className="flex items-baseline justify-between gap-4">
                  <span
                    className={cn(
                      'min-w-0 truncate text-foreground',
                      isLeader && 'type-display text-2xl',
                    )}
                  >
                    {entry.label}
                  </span>
                  <span
                    className={cn(
                      'type-catalogue',
                      isLeader
                        ? 'text-2xl font-medium text-foreground'
                        : 'text-sm text-muted-foreground',
                    )}
                  >
                    {entry.count.toLocaleString()}
                  </span>
                </div>
                <span
                  aria-hidden
                  className={cn(
                    'portrait-bar block',
                    isLeader
                      ? 'h-1 bg-(image:--lacquer)'
                      : 'h-0.75 bg-foreground/80',
                  )}
                  style={{ width: `${(entry.count / top) * 100}%` }}
                />
              </div>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
