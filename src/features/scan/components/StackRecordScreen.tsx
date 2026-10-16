import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Disc3, X } from 'lucide-react'

import { searchRecordQueryOptions } from '#/features/search/search.queries'
import { RecordScreen } from '#/shared/components/RecordScreen'
import { Button } from '#/shared/components/ui/button'

interface StackRecordScreenProps {
  releaseId: number
  /** The barcode matched several Releases: the choice can be changed */
  canChangeRelease: boolean
  onRemove: () => void
  onChangeRelease: () => void
  onClose: () => void
}

// A Stack record on the Record screen, to check it before confirming. Its
// actions are the Stack's, not the lists': it isn't added from here
export const StackRecordScreen = ({
  releaseId,
  canChangeRelease,
  onRemove,
  onChangeRelease,
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
          {canChangeRelease && (
            <Button
              variant="outline"
              onClick={() => {
                onChangeRelease()
                close()
              }}
            >
              <Disc3 />
              Change release
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
