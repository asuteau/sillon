import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { Check, Heart, Library } from 'lucide-react'

import {
  useAddToCollection,
  useRemoveFromCollection,
} from '#/features/collection/collection.mutations'
import {
  useAddToWantlist,
  useRemoveFromWantlist,
} from '#/features/wantlist/wantlist.mutations'
import { VinylDisc } from '#/shared/components/VinylDisc'
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

  const handleVersionClick = () => {
    navigate({
      search: (s) => ({ ...s, releaseId: String(version.id) }),
    }).catch(() => {})
  }

  return (
    <li className="island-shell rise-in flex items-center gap-3 rounded-2xl px-4 py-3">
      <button
        onClick={handleVersionClick}
        className="flex flex-1 items-center gap-3 min-w-0 cursor-pointer text-left"
      >
        <VinylDisc colors={['#1a1a1a']} spinning={false} size={40} />

        <div className="flex flex-1 flex-col gap-0.5 min-w-0">
          <span className="font-semibold text-(--sea-ink) truncate">
            {version.year > 0 ? version.year : '—'}
            {version.country && (
              <span className="font-mono text-xs text-(--sea-ink-soft) ml-2">
                {version.country}
              </span>
            )}
          </span>
          <span className="text-xs text-(--sea-ink-soft) truncate">
            {version.format}
          </span>
        </div>
      </button>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={handleCollectionToggle}
          disabled={isCollectionPending}
          aria-label={
            version.inCollection > 0
              ? 'Remove from collection'
              : 'Add to collection'
          }
          className={[
            'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition',
            'disabled:opacity-50 cursor-pointer',
            version.inCollection > 0
              ? 'bg-(--sea-ink) text-(--chip-bg)'
              : 'island-shell text-(--sea-ink)',
          ].join(' ')}
        >
          {version.inCollection > 0 ? (
            <Check className="h-3 w-3" />
          ) : (
            <Library className="h-3 w-3" />
          )}
          <span className="hidden sm:inline">
            {version.inCollection > 0 ? 'Owned' : 'Collection'}
          </span>
        </button>

        <button
          onClick={handleWantlistToggle}
          disabled={isWantlistPending}
          aria-label={
            version.inWantlist > 0 ? 'Remove from wantlist' : 'Add to wantlist'
          }
          className={[
            'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition',
            'disabled:opacity-50 cursor-pointer',
            version.inWantlist > 0
              ? 'bg-(--sea-ink) text-(--chip-bg)'
              : 'island-shell text-(--sea-ink)',
          ].join(' ')}
        >
          {version.inWantlist > 0 ? (
            <Check className="h-3 w-3" />
          ) : (
            <Heart className="h-3 w-3" />
          )}
          <span className="hidden sm:inline">
            {version.inWantlist > 0 ? 'Wanted' : 'Wantlist'}
          </span>
        </button>
      </div>
    </li>
  )
}
