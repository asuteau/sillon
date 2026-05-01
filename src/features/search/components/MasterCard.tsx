import { Heart, Library } from 'lucide-react'

import type { Master } from '../search.model'
import { CoverArt } from '#/shared/components/CoverArt'

interface MasterCardProps {
  master: Master
  onClick: () => void
  index: number
}

export function MasterCard({ master, onClick, index }: MasterCardProps) {
  return (
    <li>
      <button
        onClick={onClick}
        className="island-shell feature-card rise-in flex w-full items-center gap-4 rounded-2xl px-4 py-3 cursor-pointer text-left"
        style={{ animationDelay: `${index * 60}ms` }}
      >
        <CoverArt
          releaseId={String(master.id)}
          artist={master.artist}
          title={master.title}
          thumb={master.thumb || null}
          styles={[]}
          size={48}
          className="rounded-lg shrink-0 overflow-hidden"
        />
        <div className="flex flex-1 items-center justify-between">
          <div className="flex flex-col gap-0.5">
            <span className="font-semibold text-(--sea-ink)">
              {master.title}
            </span>
            <span className="text-sm text-(--sea-ink-soft)">
              {master.artist}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {master.inCollection && (
              <span className="flex items-center gap-1 rounded-full bg-(--sea-ink) px-2 py-1 text-[10px] font-bold leading-tight text-(--chip-bg)">
                <Library className="h-2.5 w-2.5" />
              </span>
            )}
            {master.inWantlist && (
              <span className="flex items-center gap-1 rounded-full bg-(--sea-ink) px-2 py-1 text-[10px] font-bold leading-tight text-(--chip-bg)">
                <Heart className="h-2.5 w-2.5" />
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
