import { HeartOff } from 'lucide-react'

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

  const handleKeep = () => onResolved(false)

  if (variant === 'row') {
    return (
      <div
        role="group"
        aria-label="Remove from wantlist?"
        className="flex items-center gap-2 shrink-0"
      >
        {removeFromWantlist.isError ? (
          <span role="alert" className="text-xs text-(--sea-ink)">
            Failed, retry?
          </span>
        ) : (
          <span className="hidden text-xs text-(--sea-ink-soft) sm:inline">
            Remove from wantlist?
          </span>
        )}
        <button
          onClick={handleRemove}
          disabled={removeFromWantlist.isPending}
          aria-label="Remove from wantlist"
          className="flex items-center gap-1.5 rounded-full bg-(--sea-ink) px-3 py-1.5 text-xs font-semibold text-(--chip-bg) transition disabled:opacity-50 cursor-pointer"
        >
          <HeartOff className="h-3 w-3" />
          Remove
        </button>
        <button
          onClick={handleKeep}
          disabled={removeFromWantlist.isPending}
          aria-label="Keep in wantlist"
          className="island-shell rounded-full px-3 py-1.5 text-xs font-semibold text-(--sea-ink) transition disabled:opacity-50 cursor-pointer"
        >
          Keep
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <div>
        <p className="font-semibold text-(--sea-ink)">Now in your collection</p>
        <p className="mt-1 text-sm text-(--sea-ink-soft)">
          It's still on your wantlist. Remove it?
        </p>
        {removeFromWantlist.isError && (
          <p role="alert" className="mt-1 text-sm text-(--sea-ink)">
            Couldn't remove from wantlist. Try again.
          </p>
        )}
      </div>
      <div className="flex w-full gap-2">
        <button
          onClick={handleKeep}
          disabled={removeFromWantlist.isPending}
          className="flex flex-1 items-center justify-center rounded-full border border-(--chip-line) bg-(--chip-bg) px-4 py-2 text-sm font-semibold text-(--sea-ink) disabled:opacity-50 cursor-pointer"
        >
          Keep
        </button>
        <button
          onClick={handleRemove}
          disabled={removeFromWantlist.isPending}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-(--sea-ink) px-4 py-2 text-sm font-semibold text-(--chip-bg) disabled:opacity-50 cursor-pointer"
        >
          <HeartOff className="h-3.5 w-3.5" />
          Remove
        </button>
      </div>
    </div>
  )
}
