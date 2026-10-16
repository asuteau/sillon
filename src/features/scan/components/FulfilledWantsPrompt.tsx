import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useMatch } from '@tanstack/react-router'
import { Check } from 'lucide-react'

import { FulfilledWantIcon } from '#/shared/components/icons/FulfilledWantIcon'
import { Button } from '#/shared/components/ui/button'
import { cn } from '#/shared/utils/cn'

import { removeStackWant } from '../scan.api'
import { patchListsAfterWantsRemoved } from '../scan.queries'
import { commitStack } from '../stack-commit'
import type { StackEntry } from '../stack.model'

interface FulfilledWantsPromptProps {
  /** Records just added to the Collection that are still on the Wantlist */
  wants: StackEntry[]
  onResolved: () => void
}

// Fulfilled wants (CONTEXT.md) from a whole Stack, asked once: all ticked,
// one tap removes them. Never removed without that tap
export const FulfilledWantsPrompt = ({
  wants,
  onResolved,
}: FulfilledWantsPromptProps) => {
  const queryClient = useQueryClient()
  const user = useMatch({ from: '__root__', select: (m) => m.context.user })
  const [ticked, setTicked] = useState(
    () => new Set(wants.map((w) => w.barcode)),
  )
  const [isRemoving, setIsRemoving] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [failedCount, setFailedCount] = useState(0)

  const toggle = (barcode: string) =>
    setTicked((current) => {
      const next = new Set(current)
      if (!next.delete(barcode)) next.add(barcode)
      return next
    })

  const handleRemove = async () => {
    const toRemove = wants.filter((w) => ticked.has(w.barcode))
    setIsRemoving(true)
    try {
      // One after another, pausing while Discogs throttles, like the adds
      const { added: removed, failed } = await commitStack({
        entries: toRemove,
        add: ({ release }) =>
          removeStackWant({ data: { releaseId: release.id } }),
        isThrottled: (result) => result.status === 'throttled',
        onEvent: (event) => {
          if (event.type === 'paused') setIsPaused(true)
          if (event.type === 'resumed') setIsPaused(false)
        },
      })
      patchListsAfterWantsRemoved(
        queryClient,
        user?.username,
        removed.map(({ entry }) => entry.release.id),
      )
      if (failed.length === 0) return onResolved()
      // Only what's left to remove stays ticked
      setTicked(new Set(failed.map((f) => f.barcode)))
      setFailedCount(failed.length)
    } catch {
      setFailedCount(toRemove.length)
    } finally {
      setIsRemoving(false)
      setIsPaused(false)
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="shrink-0 text-center">
        <p className="type-title text-base text-foreground">
          Now in your Collection
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {wants.length === 1
            ? "It's still on your Wantlist. Remove it?"
            : `${wants.length} of them are still on your Wantlist. Remove them?`}
        </p>
        {failedCount > 0 && (
          <p role="alert" className="mt-1 text-sm text-foreground">
            Couldn't remove {failedCount}. Try again.
          </p>
        )}
      </div>

      <ul className="min-h-0 flex-1 divide-y divide-border overflow-y-auto border-y border-border">
        {wants.map(({ barcode, release }) => {
          const isTicked = ticked.has(barcode)
          return (
            <li key={barcode}>
              <button
                type="button"
                role="checkbox"
                aria-checked={isTicked}
                disabled={isRemoving}
                onClick={() => toggle(barcode)}
                className="flex w-full cursor-pointer items-center gap-3 px-1 py-3 text-left transition-colors duration-160 ease-fade hover:bg-muted"
              >
                <span
                  className={cn(
                    'flex size-5 shrink-0 items-center justify-center rounded-(--radius) border transition-colors duration-160 ease-fade',
                    isTicked
                      ? 'border-foreground bg-foreground text-background'
                      : 'border-border',
                  )}
                >
                  {isTicked && <Check className="size-3.5" />}
                </span>
                <span className="flex min-w-0 flex-col">
                  <span className="type-caps truncate text-[11px] text-muted-foreground">
                    {release.artist}
                  </span>
                  <span className="type-title truncate text-[15px] text-foreground">
                    {release.title}
                  </span>
                </span>
              </button>
            </li>
          )
        })}
      </ul>

      <div className="flex shrink-0 gap-2">
        <Button
          size="lg"
          variant="outline"
          className="flex-1"
          disabled={isRemoving}
          onClick={onResolved}
        >
          Keep all
        </Button>
        <Button
          size="lg"
          className="flex-1"
          disabled={isRemoving || ticked.size === 0}
          onClick={() => void handleRemove()}
        >
          <FulfilledWantIcon />
          {isPaused
            ? 'Pausing for Discogs…'
            : `Remove ${ticked.size} from Wantlist`}
        </Button>
      </div>
    </div>
  )
}
