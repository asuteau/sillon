import { FulfilledWantIcon } from '#/shared/components/icons/FulfilledWantIcon'
import { Button } from '#/shared/components/ui/button'

import { useRemoveFromWantlist } from '../wantlist.mutations'

interface FulfilledWantPromptProps {
  releaseId: number
  // removed: true when the want was removed, false when the user kept it
  onResolved: (removed: boolean) => void
  variant?: 'panel' | 'row'
}

// Asked after adding a Release to the Collection while it is still on the Wantlist
export const FulfilledWantPrompt = ({
  releaseId,
  onResolved,
  variant = 'panel',
}: FulfilledWantPromptProps) => {
  const removeFromWantlist = useRemoveFromWantlist()

  const handleRemove = () => {
    removeFromWantlist.mutate(releaseId, {
      onSuccess: () => onResolved(true),
    })
  }

  return (
    <FulfilledWantPromptView
      variant={variant}
      onRemove={handleRemove}
      onKeep={() => onResolved(false)}
      isPending={removeFromWantlist.isPending}
      isError={removeFromWantlist.isError}
    />
  )
}

interface FulfilledWantPromptViewProps {
  onRemove: () => void
  onKeep: () => void
  isPending?: boolean
  isError?: boolean
  variant?: 'panel' | 'row'
}

// Presentational: also used by the landing page's still
export const FulfilledWantPromptView = ({
  onRemove,
  onKeep,
  isPending = false,
  isError = false,
  variant = 'panel',
}: FulfilledWantPromptViewProps) => {
  if (variant === 'row') {
    return (
      <div
        role="group"
        aria-label="Remove from wantlist?"
        className="flex shrink-0 items-center gap-2"
      >
        {isError ? (
          <span role="alert" className="text-xs text-foreground">
            Failed. Retry?
          </span>
        ) : (
          <span className="hidden text-xs text-muted-foreground sm:inline">
            Remove from wantlist?
          </span>
        )}
        <Button
          size="sm"
          onClick={onRemove}
          disabled={isPending}
          aria-label="Remove from wantlist"
        >
          <FulfilledWantIcon />
          Remove
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onKeep}
          disabled={isPending}
          aria-label="Keep in wantlist"
        >
          Keep
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <div>
        <p className="type-title text-base text-foreground">
          Now in your collection
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          It's still on your wantlist. Remove it?
        </p>
        {isError && (
          <p role="alert" className="mt-1 text-sm text-foreground">
            Couldn't remove from wantlist. Try again.
          </p>
        )}
      </div>
      <div className="flex w-full gap-2">
        <Button
          size="lg"
          variant="outline"
          onClick={onKeep}
          disabled={isPending}
          className="flex-1"
        >
          Keep
        </Button>
        <Button
          size="lg"
          onClick={onRemove}
          disabled={isPending}
          className="flex-1"
        >
          <FulfilledWantIcon />
          Remove
        </Button>
      </div>
    </div>
  )
}
