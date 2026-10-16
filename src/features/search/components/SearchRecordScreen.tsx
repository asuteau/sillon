import { useQuery, useQueryClient } from '@tanstack/react-query'

import { RecordScreen } from '#/shared/components/RecordScreen'
import { searchRecordQueryOptions } from '../search.queries'
import { SearchRecordActions } from './SearchRecordActions'

interface SearchRecordScreenProps {
  releaseId: string
  masterId: string
  onClose: () => void
}

// A Release from Search on the Record screen, shown whole: the loader stays
// until the Release and its Cover are ready
export function SearchRecordScreen({
  releaseId,
  masterId,
  onClose,
}: SearchRecordScreenProps) {
  const queryClient = useQueryClient()
  const { data: record } = useQuery(
    searchRecordQueryOptions(queryClient, releaseId),
  )

  return (
    <RecordScreen
      record={record}
      onClose={onClose}
      actions={(close) => (
        <SearchRecordActions
          releaseId={releaseId}
          masterId={masterId}
          close={close}
        />
      )}
    />
  )
}
