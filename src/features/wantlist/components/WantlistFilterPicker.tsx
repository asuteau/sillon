import { useState } from 'react'

import { FilterChip, FilterPicker } from '#/shared/components/FilterPicker'
import type { ListFilters } from '#/shared/utils/list-filter'

import { useFullWantlistRead } from '../hooks/use-full-wantlist-read'

interface WantlistFilterPickerProps {
  filters: ListFilters
  onFiltersChange: (filters: ListFilters) => void
}

// The Filter chip and its sheet. Opening it starts the full read of the
// Wantlist the facets count over; the filtered list then reuses it.
export const WantlistFilterPicker = ({
  filters,
  onFiltersChange,
}: WantlistFilterPickerProps) => {
  const [open, setOpen] = useState(false)
  const { read, retry } = useFullWantlistRead(open)

  return (
    <>
      <FilterChip onClick={() => setOpen(true)} />
      <FilterPicker
        list="wantlist"
        open={open}
        onOpenChange={setOpen}
        read={read}
        filters={filters}
        onFiltersChange={onFiltersChange}
        onRetry={retry}
      />
    </>
  )
}
