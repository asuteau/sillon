import { Suspense, useState } from 'react'
import {
  useSuspenseQuery,
  useQueryClient,
  useQuery,
} from '@tanstack/react-query'
import { Check, Heart, Library } from 'lucide-react'

import {
  useAddToCollection,
  useRemoveFromCollection,
} from '#/features/collection/collection.mutations'
import {
  useAddToWantlist,
  useRemoveFromWantlist,
} from '#/features/wantlist/wantlist.mutations'
import { MarketplaceSection } from '#/features/marketplace/components/MarketplaceSection'
import { FulfilledWantPrompt } from '#/features/wantlist/components/FulfilledWantPrompt'
import { toReleaseDetail } from '#/features/search/search.model'
import {
  releaseDetailQueryOptions,
  versionsQueryOptions,
} from '#/features/search/search.queries'
import type { VersionsPage } from '#/features/search/search.schema'
import { extractColors } from '#/shared/utils/extractColors'
import { SheetCover } from '#/shared/components/SheetCover'
import { masterCoverKey } from '#/shared/utils/cover-key'
import { Button } from './ui/button'
import { Dialog, DialogContent } from './ui/dialog'
import { Drawer, DrawerContent } from './ui/drawer'
import { useAnimatedClose } from '#/shared/hooks/use-animated-close'
import { useIsMobile } from '#/shared/hooks/use-is-mobile'

interface SearchReleaseSheetProps {
  releaseId: string
  masterId: string
  onClose: () => void
}

function SearchReleaseSheetContent({
  releaseId,
  masterId,
  onClose,
}: SearchReleaseSheetProps) {
  const queryClient = useQueryClient()
  const { data: raw } = useSuspenseQuery(releaseDetailQueryOptions(releaseId))
  const release = toReleaseDetail(raw)
  const colors = release.formatText ? extractColors(release.formatText) : []

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
        else onClose()
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
        onClose()
      }
    } catch {
      // leave state as-is
    }
  }

  const handleFulfilledWantResolved = (removed: boolean) => {
    if (removed) updateVersionsCache('in_wantlist', 0)
    onClose()
  }

  const isCollectionPending =
    addToCollection.isPending || removeFromCollection.isPending
  const isWantlistPending =
    addToWantlist.isPending || removeFromWantlist.isPending

  return (
    <div className="flex min-h-0 flex-col gap-5 overflow-y-auto">
      <SheetCover
        coverKey={masterCoverKey(masterId)}
        artist={release.artists[0] ?? ''}
        title={release.title}
        thumb={release.coverImage || null}
        styles={[]}
      />

      <div className="flex flex-col items-center gap-2 text-center">
        {release.artists.length > 0 && (
          <p className="island-kicker">{release.artists.join(', ')}</p>
        )}
        <h2 className="display-title text-2xl font-bold tracking-tight text-(--lagoon-deep)">
          {release.title}
        </h2>
      </div>

      <div className="flex flex-col items-center gap-2 text-center font-mono text-sm">
        {(release.year > 0 || release.country) && (
          <p className="text-(--sea-ink-soft)">
            {[
              release.year > 0 ? String(release.year) : null,
              release.country || null,
            ]
              .filter(Boolean)
              .join(' · ')}
          </p>
        )}

        {release.formatText && (
          <p
            className="line-clamp-2 text-(--sea-ink-soft)"
            title={release.formatText}
          >
            {release.formatText}
          </p>
        )}

        {colors.length > 0 && (
          <div className="flex items-center gap-2 pt-1">
            {colors.map((color) => (
              <span
                key={color}
                title={color}
                className="h-4.5 w-4.5 rounded-full border border-(--line) shrink-0"
                style={{ background: color }}
              />
            ))}
          </div>
        )}
      </div>

      <MarketplaceSection releaseId={Number(releaseId)} />

      {isAskingFulfilledWant ? (
        <FulfilledWantPrompt
          releaseId={Number(releaseId)}
          onResolved={handleFulfilledWantResolved}
        />
      ) : (
        <div className="flex justify-center gap-3 pt-1">
          <Button
            variant={inCollection > 0 ? 'default' : 'outline'}
            className="rounded-full"
            disabled={isCollectionPending}
            onClick={handleCollectionToggle}
          >
            {inCollection > 0 ? (
              <Check className="h-4 w-4" />
            ) : (
              <Library className="h-4 w-4" />
            )}
            {inCollection > 0 ? 'Owned' : 'Collection'}
          </Button>

          <Button
            variant={inWantlist > 0 ? 'default' : 'outline'}
            className="rounded-full"
            disabled={isWantlistPending}
            onClick={handleWantlistToggle}
          >
            {inWantlist > 0 ? (
              <Check className="h-4 w-4" />
            ) : (
              <Heart className="h-4 w-4" />
            )}
            {inWantlist > 0 ? 'Wanted' : 'Wantlist'}
          </Button>
        </div>
      )}
    </div>
  )
}

export function SearchReleaseSheet({
  releaseId,
  masterId,
  onClose,
}: SearchReleaseSheetProps) {
  const isMobile = useIsMobile()
  const { open, close, onOpenChange, onAnimationEnd } =
    useAnimatedClose(onClose)

  const content = (
    <Suspense
      fallback={
        <div className="py-8 text-center text-sm text-(--sea-ink-soft)">
          Loading…
        </div>
      }
    >
      <SearchReleaseSheetContent
        releaseId={releaseId}
        masterId={masterId}
        onClose={close}
      />
    </Suspense>
  )

  if (isMobile) {
    return (
      <Drawer
        open={open}
        onOpenChange={onOpenChange}
        onAnimationEnd={onAnimationEnd}
      >
        <DrawerContent className="island-shell p-6">{content}</DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      onOpenChangeComplete={onAnimationEnd}
    >
      <DialogContent
        className="max-w-sm rounded-none border-0 bg-transparent p-0 ring-0 shadow-none"
        showCloseButton={false}
      >
        <div className="island-shell flex max-h-[90dvh] flex-col overflow-hidden rounded-3xl p-6">
          {content}
        </div>
      </DialogContent>
    </Dialog>
  )
}
