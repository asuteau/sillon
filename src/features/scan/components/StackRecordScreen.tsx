import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Disc3, X } from 'lucide-react'

import { searchRecordQueryOptions } from '#/features/search/search.queries'
import { RecordScreen } from '#/shared/components/RecordScreen'
import { Button } from '#/shared/components/ui/button'

interface StackRecordScreenProps {
  releaseId: number
  /** The barcode matched several Releases: the choice can be changed */
  canChangePressing: boolean
  onRemove: () => void
  onChangePressing: () => void
  onClose: () => void
}

// A Stack record on the Record screen, to check it before confirming. Its
// actions are the Stack's, not the lists': it isn't added from here
export const StackRecordScreen = ({
  releaseId,
  canChangePressing,
  onRemove,
  onChangePressing,
  onClose,
}: StackRecordScreenProps) => {
  const queryClient = useQueryClient()
  const { data: record } = useQuery(
    searchRecordQueryOptions(queryClient, String(releaseId)),
  )

  return (
    <RecordScreen
      record={record}
      onClose={onClose}
      actions={(close) => (
        <div className="flex flex-wrap justify-center gap-2">
          {canChangePressing && (
            <Button
              variant="outline"
              onClick={() => {
                onChangePressing()
                close()
              }}
            >
              <Disc3 />
              Change pressing
            </Button>
          )}
          <Button
            variant="destructive"
            onClick={() => {
              onRemove()
              close()
            }}
          >
            <X />
            Remove from Stack
          </Button>
        </div>
      )}
    />
  )
}
