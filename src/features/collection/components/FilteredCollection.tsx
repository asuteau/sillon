import { FilteredListView } from '#/shared/components/FilteredList'
import type { FilteredListProps } from '#/shared/components/FilteredList'

import type { CollectionRelease } from '../collection.schema'
import { formatListMeta } from '../collection.utils'
import { useFullCollectionRead } from '../hooks/use-full-collection-read'
import { ReleaseRow } from './ReleaseRow'

interface FilteredCollectionProps extends FilteredListProps {
  onSelect: (release: CollectionRelease) => void
}

// Discogs can't filter a Collection: filters run over the full read of it
export const FilteredCollection = ({
  onSelect,
  ...props
}: FilteredCollectionProps) => {
  const { read, retry } = useFullCollectionRead(true)
  return (
    <FilteredListView
      {...props}
      list="collection"
      read={read}
      onRetry={retry}
      recordKey={(release) => release.instance_id}
      renderRecord={(release) => (
        <ReleaseRow
          release={release}
          meta={formatListMeta(release, props.listSort.sort)}
          onClick={() => onSelect(release)}
        />
      )}
    />
  )
}
