import type { CollectionRelease } from '#/features/collection/collection.schema'
import { formatDateAdded } from '#/features/collection/collection.utils'
import { CoverArt } from '#/shared/components/CoverArt'
import { Button } from '#/shared/components/ui/button'
import { Dialog, DialogContent } from '#/shared/components/ui/dialog'
import { Drawer, DrawerContent } from '#/shared/components/ui/drawer'
import { useIsMobile } from '#/shared/hooks/use-is-mobile'
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
  const fmt = info.formats[0]
  const formatParts = fmt
    ? [fmt.name, ...(fmt.descriptions ?? []), fmt.text].filter(Boolean)
    : []
  const label = info.labels[0]
  const catno =
    label?.catno && label.catno.toLowerCase() !== 'none' ? label.catno : null
  const labelText = label
    ? [label.name, catno].filter(Boolean).join(' · ')
    : null

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
        <p className="flex flex-wrap justify-center items-center gap-x-3 gap-y-1 font-mono text-sm text-(--sea-ink-soft)">
          {info.year > 0 && <span>{info.year}</span>}
          {info.year > 0 && <span aria-hidden>·</span>}
          <span>{formatDateAdded(record.date_added)}</span>
        </p>
        {formatParts.length > 0 && (
          <p className="font-mono text-sm text-(--sea-ink-soft)">
            {formatParts.join(' · ')}
          </p>
        )}
        {labelText && (
          <p className="text-sm text-(--sea-ink-soft)">{labelText}</p>
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
      <Drawer open onOpenChange={onClose}>
        <DrawerContent className="island-shell overflow-y-auto p-6">
          <SpotlightContent
            record={record}
            onClose={onClose}
            onPickAgain={onPickAgain}
            isPicking={isPicking}
            onRemove={onRemove}
            isRemoving={isRemoving}
          />
        </DrawerContent>
      </Drawer>
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
