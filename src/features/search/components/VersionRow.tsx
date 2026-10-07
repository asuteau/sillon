import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { Check } from 'lucide-react'
import { CollectionIcon } from '#/shared/components/icons/CollectionIcon'
import { WantlistIcon } from '#/shared/components/icons/WantlistIcon'
import { Button } from '#/shared/components/ui/button'

import {
  useAddToCollection,
  useRemoveFromCollection,
} from '#/features/collection/collection.mutations'
import {
  useAddToWantlist,
  useRemoveFromWantlist,
} from '#/features/wantlist/wantlist.mutations'
import { FulfilledWantPrompt } from '#/features/wantlist/components/FulfilledWantPrompt'
import { versionsQueryOptions } from '../search.queries'
import type { MasterVersion } from '../search.model'
import type { VersionsPage } from '../search.schema'

interface VersionRowProps {
  version: MasterVersion
  masterId: string
}

export function VersionRow({ version, masterId }: VersionRowProps) {
  const queryClient = useQueryClient()
  const navigate = useNavigate({ from: '/search' })

  const addToCollection = useAddToCollection()
  const removeFromCollection = useRemoveFromCollection()
  const addToWantlist = useAddToWantlist()
  const removeFromWantlist = useRemoveFromWantlist()
  const [isAskingFulfilledWant, setIsAskingFulfilledWant] = useState(false)

  function updateVersionsCache(
    field: 'in_collection' | 'in_wantlist',
    value: number,
  ) {
    queryClient.setQueryData(
      versionsQueryOptions(masterId).queryKey,
      (old: VersionsPage | undefined) => {
        if (!old) return old
        return {
          ...old,
          versions: old.versions.map((v) =>
            v.id === version.id
              ? {
                  ...v,
                  stats: {
                    user: { ...v.stats.user, [field]: value },
                  },
                }
              : v,
          ),
        }
      },
    )
  }

  const handleCollectionToggle = async () => {
    try {
      if (version.inCollection > 0) {
        await removeFromCollection.mutateAsync({ releaseId: version.id })
        updateVersionsCache('in_collection', 0)
      } else {
        await addToCollection.mutateAsync(version.id)
        updateVersionsCache('in_collection', 1)
        if (version.inWantlist > 0) setIsAskingFulfilledWant(true)
      }
    } catch {
      // mutation error — leave state as-is
    }
  }

  const handleWantlistToggle = async () => {
    try {
      if (version.inWantlist > 0) {
        await removeFromWantlist.mutateAsync(version.id)
        updateVersionsCache('in_wantlist', 0)
      } else {
        await addToWantlist.mutateAsync(version.id)
        updateVersionsCache('in_wantlist', 1)
      }
    } catch {
      // mutation error — leave state as-is
    }
  }

  const isCollectionPending =
    addToCollection.isPending || removeFromCollection.isPending
  const isWantlistPending =
    addToWantlist.isPending || removeFromWantlist.isPending

  const handleFulfilledWantResolved = (removed: boolean) => {
    if (removed) updateVersionsCache('in_wantlist', 0)
    setIsAskingFulfilledWant(false)
  }

  const handleVersionClick = () => {
    navigate({
      search: (s) => ({ ...s, releaseId: String(version.id) }),
    }).catch(() => {})
  }

  return (
    <li className="flex items-center gap-3 py-3">
      <button
        type="button"
        onClick={handleVersionClick}
        className="flex min-w-0 flex-1 cursor-pointer flex-col gap-1 px-1 text-left transition-opacity duration-160 ease-fade hover:opacity-70"
      >
        <span className="type-catalogue text-sm text-foreground">
          {version.year > 0 ? version.year : '—'}
          {version.country && (
            <span className="ml-2 text-muted-foreground">
              {version.country}
            </span>
          )}
        </span>
        <span className="type-catalogue truncate text-[11px] text-muted-foreground">
          {version.format}
        </span>
      </button>

      {isAskingFulfilledWant ? (
        <FulfilledWantPrompt
          releaseId={version.id}
          onResolved={handleFulfilledWantResolved}
          variant="row"
        />
      ) : (
        <div className="flex shrink-0 items-center gap-2">
          <Button
            size="sm"
            variant={version.inCollection > 0 ? 'default' : 'outline'}
            onClick={handleCollectionToggle}
            disabled={isCollectionPending}
            aria-label={
              version.inCollection > 0
                ? 'Remove from collection'
                : 'Add to collection'
            }
          >
            {version.inCollection > 0 ? <Check /> : <CollectionIcon />}
            <span className="hidden sm:inline">
              {version.inCollection > 0 ? 'Owned' : 'Collection'}
            </span>
          </Button>

          <Button
            size="sm"
            variant={version.inWantlist > 0 ? 'default' : 'outline'}
            onClick={handleWantlistToggle}
            disabled={isWantlistPending}
            aria-label={
              version.inWantlist > 0
                ? 'Remove from wantlist'
                : 'Add to wantlist'
            }
          >
            {version.inWantlist > 0 ? <Check /> : <WantlistIcon />}
            <span className="hidden sm:inline">
              {version.inWantlist > 0 ? 'Wanted' : 'Wantlist'}
            </span>
          </Button>
        </div>
      )}
    </li>
  )
}
