import type { Master } from '../search.model'

interface MasterCardProps {
  master: Master
  onClick: () => void
  index: number
  ownedCount?: number
}

export function MasterCard({
  master,
  onClick,
  index,
  ownedCount = 0,
}: MasterCardProps) {
  return (
    <li>
      <button
        onClick={onClick}
        className="island-shell feature-card rise-in flex w-full items-center gap-4 rounded-2xl px-4 py-3 cursor-pointer text-left"
        style={{ animationDelay: `${index * 60}ms` }}
      >
        <img
          src={master.thumb}
          alt={master.title}
          className="h-12 w-12 rounded-lg object-cover shrink-0"
        />
        <div className="flex flex-1 items-center justify-between">
          <div className="flex flex-col gap-0.5">
            <span className="font-semibold text-(--sea-ink)">
              {master.title}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {ownedCount > 0 && (
              <span className="flex items-center gap-1 rounded-full bg-(--sea-ink) px-2 py-0.5 text-[10px] font-bold leading-none text-(--chip-bg)">
                {ownedCount}
              </span>
            )}
            {master.year !== null && (
              <span className="font-mono text-xs text-(--sea-ink-soft)">
                {master.year}
              </span>
            )}
          </div>
        </div>
      </button>
    </li>
  )
}
