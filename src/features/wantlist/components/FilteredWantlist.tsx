import { formatListMeta } from '#/features/collection/collection.utils'
import { ReleaseRow } from '#/features/collection/components/ReleaseRow'
import { FilteredListView } from '#/shared/components/FilteredList'
import type { FilteredListProps } from '#/shared/components/FilteredList'

import { useFullWantlistRead } from '../hooks/use-full-wantlist-read'
import type { WantlistItem } from '../wantlist.schema'

interface FilteredWantlistProps extends FilteredListProps {
  onSelect: (want: WantlistItem) => void
}

// Discogs can't filter a Wantlist: filters run over the full read of it
export const FilteredWantlist = ({
  onSelect,
  ...props
}: FilteredWantlistProps) => {
  const { read, retry } = useFullWantlistRead(true)
  return (
    <FilteredListView
      {...props}
      list="wantlist"
      read={read}
      onRetry={retry}
      recordKey={(want) => want.id}
      renderRecord={(want) => (
        <ReleaseRow
          release={want}
          meta={formatListMeta(want, props.listSort.sort)}
          onClick={() => onSelect(want)}
        />
      )}
    />
  )
}
