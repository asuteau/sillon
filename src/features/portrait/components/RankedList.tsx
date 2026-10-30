import { Link } from '@tanstack/react-router'
import { useId } from 'react'

import { formatRecords } from '#/shared/utils/format-records'
import { cn } from '#/shared/utils/cn'
import type { ListFilters } from '#/shared/utils/list-filter'

import { leaderCount } from '../portrait.utils'

export interface RankedEntry {
  key: string | number
  label: string
  count: number
  /** The Collection filter the row opens; none for a still row */
  filter?: ListFilters
}

interface RankedListProps {
  title: string
  /** Most Copies first: bars are drawn against the first entry */
  entries: RankedEntry[]
}

const formatRank = (index: number) => String(index + 1).padStart(2, '0')

const ROW = 'grid grid-cols-[2rem_1fr] items-baseline'

// Typeset ranked rows: rank, name, count, and a bar against the top entry.
// Leaders get a copper bar and a full-strength count, same size as the rest.
// The bars draw in on reveal (fade under reduced motion). A row with a filter
// opens the Collection filtered by it; its padding is cancelled by negative
// margin, so the tap target reaches 44px (a 35px row plus 16px) without
// moving a pixel, and meets the next row's in the gap between them.
export const RankedList = ({ title, entries }: RankedListProps) => {
  const titleId = useId()
  const top = entries[0]?.count ?? 1
  const leader = leaderCount(entries.map((entry) => entry.count))

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
          const row = (
            <RankedRow
              entry={entry}
              rank={formatRank(index)}
              isLeader={entry.count === leader}
              width={entry.count / top}
            />
          )
          return (
            <li key={entry.key}>
              {entry.filter ? (
                <Link
                  to="/collection"
                  search={entry.filter}
                  aria-label={`${entry.label}, ${formatRecords(entry.count)}`}
                  className={cn(
                    ROW,
                    'group -my-2 py-2 text-inherit no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground',
                  )}
                >
                  {row}
                </Link>
              ) : (
                <div className={ROW}>{row}</div>
              )}
            </li>
          )
        })}
      </ol>
    </section>
  )
}

interface RankedRowProps {
  entry: RankedEntry
  rank: string
  isLeader: boolean
  /** Share of the top entry */
  width: number
}

const RankedRow = ({ entry, rank, isLeader, width }: RankedRowProps) => (
  <>
    <span
      aria-hidden
      className="type-catalogue text-[11px] text-muted-foreground"
    >
      {rank}
    </span>
    <div className="flex min-w-0 flex-col gap-2">
      <div className="flex items-baseline justify-between gap-4">
        <span className="min-w-0 truncate text-foreground group-hover:underline">
          {entry.label}
        </span>
        <span
          className={cn(
            'type-catalogue text-sm',
            isLeader ? 'text-foreground' : 'text-muted-foreground',
          )}
        >
          {entry.count.toLocaleString()}
        </span>
      </div>
      <span
        aria-hidden
        className={cn(
          'portrait-bar block h-0.75',
          isLeader ? 'bg-(--lacquer-2)' : 'bg-foreground/80',
        )}
        style={{ width: `${width * 100}%` }}
      />
    </div>
  </>
)
