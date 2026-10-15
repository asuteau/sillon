import type { CollectionRelease } from '#/features/collection/collection.schema'
import { GrooveLoader } from '#/shared/components/brand/GrooveLoader'
import { RandomPickIcon } from '#/shared/components/icons/RandomPickIcon'
import { RecordScreen } from '#/shared/components/RecordScreen'
import { Button } from '#/shared/components/ui/button'

interface RandomPickSpotlightProps {
  record: CollectionRelease | undefined
  isPicking: boolean
  isError: boolean
  onPickAgain: () => void
  onClose: () => void
}

// The Random pick's record screen, with Pick again as its action
export const RandomPickSpotlight = ({
  record,
  isPicking,
  isError,
  onPickAgain,
  onClose,
}: RandomPickSpotlightProps) => {
  if (!record) return null

  return (
    <RecordScreen
      record={record}
      onClose={onClose}
      actions={
        <>
          <Button variant="lacquer" onClick={onPickAgain} disabled={isPicking}>
            {isPicking ? <GrooveLoader size={14} /> : <RandomPickIcon />}
            Pick again
          </Button>
          {isError && (
            <p role="alert" className="m-0 text-sm text-foreground">
              Couldn't reach Discogs. Try again.
            </p>
          )}
        </>
      }
    />
  )
}
