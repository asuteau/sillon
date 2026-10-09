import { Suspense, useState } from 'react'
import {
  useSuspenseQuery,
  useQueryClient,
  useQuery,
} from '@tanstack/react-query'

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
import { GrooveLoader } from '#/shared/components/brand/GrooveLoader'
import { RecordHeading } from '#/shared/components/RecordHeading'
import { ReleaseListButtons } from '#/shared/components/ReleaseListButtons'
import { SheetCover } from '#/shared/components/SheetCover'
import { masterCoverKey } from '#/shared/utils/cover-key'
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
        credits={release.credits}
        title={release.title}
        styles={[]}
      />

      <div className="flex flex-col items-center gap-3">
        <RecordHeading
          artist={release.artists.join(', ')}
          title={release.title}
          catalogue={[
            [release.year > 0 ? String(release.year) : null, release.country]
              .filter(Boolean)
              .join(' · '),
            release.formatText,
          ]}
        />

        {colors.length > 0 && (
          <div className="flex items-center gap-2">
            {colors.map((color) => (
              <span
                key={color}
                title={color}
                className="size-4.5 shrink-0 rounded-full border border-border"
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
        <ReleaseListButtons
          inCollection={inCollection > 0}
          inWantlist={inWantlist > 0}
          onCollectionToggle={handleCollectionToggle}
          onWantlistToggle={handleWantlistToggle}
          isCollectionPending={isCollectionPending}
          isWantlistPending={isWantlistPending}
        />
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
        <div className="flex justify-center py-8">
          <GrooveLoader size={32} />
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
        <DrawerContent className="p-6">{content}</DrawerContent>
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
        className="flex max-h-[90dvh] flex-col gap-0 overflow-hidden p-6"
        showCloseButton={false}
      >
        {content}
      </DialogContent>
    </Dialog>
  )
}
