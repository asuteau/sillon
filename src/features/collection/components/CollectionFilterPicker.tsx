import { useMemo, useState } from 'react'

import { FilterChip, FilterPicker } from '#/shared/components/FilterPicker'
import type { FilterPickerRead } from '#/shared/components/FilterPicker'
import type { ListFilters } from '#/shared/utils/list-filter'

import { useFullCollectionRead } from '../hooks/use-full-collection-read'

interface CollectionFilterPickerProps {
  filters: ListFilters
  onFiltersChange: (filters: ListFilters) => void
}

// The Filter chip and its sheet. Opening it starts the full read of the
// Collection the facets count over; the filtered list then reuses it.
export const CollectionFilterPicker = ({
  filters,
  onFiltersChange,
}: CollectionFilterPickerProps) => {
  const [open, setOpen] = useState(false)
  const { read, retry } = useFullCollectionRead(open)
  const pickerRead = useMemo(
    (): FilterPickerRead =>
      read.status === 'read' ? { status: 'read', records: read.copies } : read,
    [read],
  )

  return (
    <>
      <FilterChip onClick={() => setOpen(true)} />
      <FilterPicker
        list="collection"
        open={open}
        onOpenChange={setOpen}
        read={pickerRead}
        filters={filters}
        onFiltersChange={onFiltersChange}
        onRetry={retry}
      />
    </>
  )
}
