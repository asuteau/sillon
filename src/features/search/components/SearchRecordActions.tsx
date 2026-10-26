import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'

import {
  useAddToCollection,
  useRemoveFromCollection,
} from '#/features/collection/collection.mutations'
import {
  useAddToWantlist,
  useRemoveFromWantlist,
} from '#/features/wantlist/wantlist.mutations'
import { FulfilledWantPrompt } from '#/features/wantlist/components/FulfilledWantPrompt'
import { ReleaseListButtons } from '#/shared/components/ReleaseListButtons'
import { syncMasterUserData, versionsQueryOptions } from '../search.queries'
import type { VersionsPage } from '../search.schema'

interface SearchRecordActionsProps {
  releaseId: string
  masterId: string
  /** Closes the Record screen with its exit animation */
  close: () => void
}

// The Record screen's actions for a Release from Search: add it to, or
// remove it from, the Collection and Wantlist
export function SearchRecordActions({
  releaseId,
  masterId,
  close,
}: SearchRecordActionsProps) {
  const queryClient = useQueryClient()
  const { data: versionsData } = useQuery(versionsQueryOptions(masterId))
  const version = versionsData?.versions.find((v) => String(v.id) === releaseId)
  const inCollection = version?.stats.user.in_collection ?? 0
  const inWantlist = version?.stats.user.in_wantlist ?? 0

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
            String(v.id) === releaseId
              ? { ...v, stats: { user: { ...v.stats.user, [field]: value } } }
              : v,
          ),
        }
      },
    )
    syncMasterUserData(queryClient, masterId, field)
  }

  const handleCollectionToggle = async () => {
    try {
      if (inCollection > 0) {
        await removeFromCollection.mutateAsync({
          releaseId: Number(releaseId),
        })
        updateVersionsCache('in_collection', 0)
      } else {
        await addToCollection.mutateAsync(Number(releaseId))
        updateVersionsCache('in_collection', 1)
        if (inWantlist > 0) setIsAskingFulfilledWant(true)
        else close()
      }
    } catch {
      // leave state as-is
    }
  }

  const handleWantlistToggle = async () => {
    try {
      if (inWantlist > 0) {
        await removeFromWantlist.mutateAsync(Number(releaseId))
        updateVersionsCache('in_wantlist', 0)
      } else {
        await addToWantlist.mutateAsync(Number(releaseId))
        updateVersionsCache('in_wantlist', 1)
        close()
      }
    } catch {
      // leave state as-is
    }
  }

  const handleFulfilledWantResolved = (removed: boolean) => {
    if (removed) updateVersionsCache('in_wantlist', 0)
    close()
  }

  if (isAskingFulfilledWant) {
    return (
      <FulfilledWantPrompt
        releaseId={Number(releaseId)}
        onResolved={handleFulfilledWantResolved}
      />
    )
  }

  return (
    <ReleaseListButtons
      inCollection={inCollection > 0}
      inWantlist={inWantlist > 0}
      onCollectionToggle={handleCollectionToggle}
      onWantlistToggle={handleWantlistToggle}
      isCollectionPending={
        addToCollection.isPending || removeFromCollection.isPending
      }
      isWantlistPending={
        addToWantlist.isPending || removeFromWantlist.isPending
      }
    />
  )
}
