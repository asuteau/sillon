import { ArrowDown, ArrowUp } from 'lucide-react'

import { GrooveLoader } from '#/shared/components/brand/GrooveLoader'
import { Chip, ChipRow } from '#/shared/components/ui/chip'
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
    <ChipRow role="group" aria-label="Sort by" className="mb-6">
      {SORT_KEYS.map((key) => {
        const isActive = value.sort === key
        return (
          <Chip
            key={key}
            active={isActive}
            onClick={() => onSelect(key)}
            aria-label={
              isActive
                ? `${LABELS[key]}, ${value.order === 'asc' ? 'ascending' : 'descending'}`
                : LABELS[key]
            }
          >
            {LABELS[key]}
            {isActive &&
              (isPending ? (
                <GrooveLoader size={14} />
              ) : (
                <OrderIcon size={14} />
              ))}
          </Chip>
        )
      })}
    </ChipRow>
  )
}
