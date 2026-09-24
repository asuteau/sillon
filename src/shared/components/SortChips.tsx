import { ArrowDown, ArrowUp, Disc3 } from 'lucide-react'

import { SORT_KEYS } from '#/shared/utils/list-sort'
import type { ListSort, SortKey } from '#/shared/utils/list-sort'

const LABELS: Record<SortKey, string> = {
  added: 'Added',
  artist: 'Artist',
  title: 'Title',
  year: 'Year',
}

interface SortChipsProps {
  value: ListSort
  onSelect: (key: SortKey) => void
  isPending?: boolean
}

export const SortChips = ({ value, onSelect, isPending }: SortChipsProps) => {
  const OrderIcon = value.order === 'asc' ? ArrowUp : ArrowDown

  return (
    <div role="group" aria-label="Sort by" className="mb-6 flex gap-2">
      {SORT_KEYS.map((key) => {
        const isActive = value.sort === key
        return (
          <button
            key={key}
            type="button"
            onClick={() => onSelect(key)}
            aria-pressed={isActive}
            aria-label={
              isActive
                ? `${LABELS[key]}, ${value.order === 'asc' ? 'ascending' : 'descending'}`
                : LABELS[key]
            }
            className={`flex cursor-pointer items-center gap-1 whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
              isActive
                ? 'bg-(--sea-ink) text-(--chip-bg)'
                : 'border border-(--line) text-(--sea-ink)'
            }`}
          >
            {LABELS[key]}
            {isActive &&
              (isPending ? (
                <Disc3 size={14} className="animate-spin opacity-70" />
              ) : (
                <OrderIcon size={14} />
              ))}
          </button>
        )
      })}
    </div>
  )
}
