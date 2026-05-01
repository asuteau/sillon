import type { CollectionRelease } from '#/features/collection/collection.schema'
import { Button } from '#/shared/components/ui/button'
import { CoverArt } from '#/shared/components/CoverArt'
import { Dialog, DialogContent } from '#/shared/components/ui/dialog'
import { Sheet, SheetContent } from '#/shared/components/ui/sheet'
import { useIsMobile } from '#/shared/hooks/useIsMobile'
import { Library, Shuffle } from 'lucide-react'

interface Props {
  record: CollectionRelease
  onClose: () => void
  onPickAgain?: () => void
  isPicking?: boolean
  onRemove?: () => void
  isRemoving?: boolean
}

const SpotlightContent = ({
  record,
  onPickAgain,
  isPicking,
  onRemove,
  isRemoving,
}: Props) => {
  const { basic_information: info } = record
  return (
    <div className="flex flex-col gap-5">
      <CoverArt
        key={record.id}
        releaseId={String(record.id)}
        artist={info.artists[0]?.name ?? ''}
        title={info.title}
        thumb={info.thumb}
        styles={info.styles}
        className="w-full aspect-square rounded-2xl overflow-hidden"
      />

      <div className="flex flex-col items-center gap-2 text-center">
        <p className="island-kicker">
          {info.artists.map((a) => a.name).join(', ')}
        </p>
        <h2 className="display-title text-2xl font-bold tracking-tight text-(--sea-ink)">
          {info.title}
        </h2>
        {info.year > 0 && (
          <p className="font-mono text-sm text-(--sea-ink-soft)">{info.year}</p>
        )}
      </div>

      <div className="flex justify-center pt-1">
        {onRemove && (
          <Button
            variant="destructive"
            className="rounded-full"
            disabled={isRemoving}
            onClick={onRemove}
          >
            <Library className="h-4 w-4" />
            Remove from collection
          </Button>
        )}
        {!onRemove && (
          <button
            onClick={onPickAgain}
            disabled={isPicking}
            className="flex items-center gap-1.5 rounded-full border border-(--chip-line) bg-(--chip-bg) px-4 py-2 text-sm font-semibold text-(--sea-ink) disabled:opacity-50 cursor-pointer"
          >
            <Shuffle
              className={`h-3.5 w-3.5 ${isPicking ? 'animate-spin' : ''}`}
            />
            Pick again
          </button>
        )}
      </div>
    </div>
  )
}

export const RecordSpotlight = ({
  record,
  onClose,
  onPickAgain,
  isPicking,
  onRemove,
  isRemoving,
}: Props) => {
  const isMobile = useIsMobile()

  if (isMobile) {
    return (
      <Sheet open onOpenChange={onClose}>
        <SheetContent
          side="bottom"
          className="h-[90dvh] border-0 bg-transparent p-4 shadow-none"
          showCloseButton={false}
        >
          <div className="island-shell h-full overflow-y-auto rounded-t-3xl p-6">
            <SpotlightContent
              record={record}
              onClose={onClose}
              onPickAgain={onPickAgain}
              isPicking={isPicking}
              onRemove={onRemove}
              isRemoving={isRemoving}
            />
          </div>
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent
        className="max-w-sm rounded-none border-0 bg-transparent p-0 ring-0 shadow-none"
        showCloseButton={false}
      >
        <div className="island-shell overflow-hidden rounded-3xl p-6">
          <SpotlightContent
            record={record}
            onClose={onClose}
            onPickAgain={onPickAgain}
            isPicking={isPicking}
            onRemove={onRemove}
            isRemoving={isRemoving}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
