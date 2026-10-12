import { useId } from 'react'
import type { ReactNode } from 'react'

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
// The bars draw in on reveal (fade under reduced motion).
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
        {entries.map((entry, index) => (
          <li
            key={entry.key}
            className="grid grid-cols-[2rem_1fr] items-baseline"
          >
            <span
              aria-hidden
              className="type-catalogue text-[11px] text-muted-foreground"
            >
              {formatRank(index)}
            </span>
            <div className="flex min-w-0 flex-col gap-2">
              <div className="flex items-baseline justify-between gap-4">
                <span className="min-w-0 truncate text-foreground">
                  {entry.label}
                </span>
                <span className="type-catalogue text-sm text-muted-foreground">
                  {entry.count.toLocaleString()}
                </span>
              </div>
              <span
                aria-hidden
                className="portrait-bar block h-0.75 bg-foreground/80"
                style={{ width: `${(entry.count / top) * 100}%` }}
              />
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}
