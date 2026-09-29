import type { CollectionRelease } from '#/features/collection/collection.schema'
import { RecordSpotlight } from './RecordSpotlight'

interface RandomPickSpotlightProps {
  record: CollectionRelease | undefined
  isPicking: boolean
  onPickAgain: () => void
  onClose: () => void
}

export const RandomPickSpotlight = ({
  record,
  isPicking,
  onPickAgain,
  onClose,
}: RandomPickSpotlightProps) => {
  if (!record) return null

  return (
    <RecordSpotlight
      record={record}
      onClose={onClose}
      onPickAgain={onPickAgain}
      isPicking={isPicking}
    />
  )
}
