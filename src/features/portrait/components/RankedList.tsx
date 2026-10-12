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
  entries: RankedEntry[]
}

// Typeset ranked rows: name, count, and a hairline bar against the top entry.
// The bars draw in on reveal (fade under reduced motion).
export const RankedList = ({ title, entries }: RankedListProps) => {
  const titleId = useId()
  const top = entries[0]?.count ?? 1

  return (
    <section aria-labelledby={titleId} className="portrait-reveal mt-10">
      <h2
        id={titleId}
        className="type-caps mb-3 text-[11px] text-muted-foreground"
      >
        {title}
      </h2>
      <ol className="m-0 flex list-none flex-col gap-3 p-0">
        {entries.map((entry) => (
          <li key={entry.key} className="flex flex-col gap-1.5">
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
              className="portrait-bar block h-px bg-foreground"
              style={{ width: `${(entry.count / top) * 100}%` }}
            />
          </li>
        ))}
      </ol>
    </section>
  )
}
