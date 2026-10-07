import type { CollectionRelease } from '#/features/collection/collection.schema'
import { formatDateAdded } from '#/features/collection/collection.utils'
import { GrooveLoader } from '#/shared/components/brand/GrooveLoader'
import { RecordHeading } from '#/shared/components/RecordHeading'
import { SheetCover } from '#/shared/components/SheetCover'
import { releaseCoverKey } from '#/shared/utils/cover-key'
import { Button } from '#/shared/components/ui/button'
import { Dialog, DialogContent } from '#/shared/components/ui/dialog'
import { Drawer, DrawerContent } from '#/shared/components/ui/drawer'
import { useIsMobile } from '#/shared/hooks/use-is-mobile'
import { CollectionIcon } from '#/shared/components/icons/CollectionIcon'
import { RandomPickIcon } from '#/shared/components/icons/RandomPickIcon'

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
  const fmt = info.formats.at(0)
  const formatParts = fmt
    ? [fmt.name, ...(fmt.descriptions ?? []), fmt.text].filter(Boolean)
    : []
  const label = info.labels.at(0)
  const catno =
    label?.catno && label.catno.toLowerCase() !== 'none' ? label.catno : null
  const labelText = label
    ? [label.name, catno].filter(Boolean).join(' · ')
    : null

  return (
    <div className="flex min-h-0 flex-col gap-5 overflow-y-auto">
      <SheetCover
        key={record.id}
        coverKey={releaseCoverKey(record.id, info.master_id)}
        artist={info.artists[0]?.name ?? ''}
        title={info.title}
        thumb={info.thumb}
        styles={info.styles}
      />

      <RecordHeading
        artist={info.artists.map((a) => a.name).join(', ')}
        title={info.title}
        catalogue={[
          [
            info.year > 0 ? String(info.year) : null,
            formatDateAdded(record.date_added),
          ]
            .filter(Boolean)
            .join(' · '),
          formatParts.join(' · '),
          labelText,
        ]}
      />

      <div className="flex justify-center pt-1">
        {onRemove && (
          <Button
            variant="destructive"
            disabled={isRemoving}
            onClick={onRemove}
          >
            <CollectionIcon />
            Remove from collection
          </Button>
        )}
        {!onRemove && (
          <Button variant="lacquer" onClick={onPickAgain} disabled={isPicking}>
            {isPicking ? <GrooveLoader size={14} /> : <RandomPickIcon />}
            Pick again
          </Button>
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
        <DrawerContent className="p-6">
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
        className="flex max-h-[90dvh] flex-col gap-0 overflow-hidden p-6"
        showCloseButton={false}
      >
        <SpotlightContent
          record={record}
          onClose={onClose}
          onPickAgain={onPickAgain}
          isPicking={isPicking}
          onRemove={onRemove}
          isRemoving={isRemoving}
        />
      </DialogContent>
    </Dialog>
  )
}
