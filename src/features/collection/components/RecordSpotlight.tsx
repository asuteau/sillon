import type { CollectionRelease } from '#/features/collection/collection.schema'
import {
  formatArtists,
  formatDateAdded,
  leadArtist,
} from '#/features/collection/collection.utils'
import { GrooveLoader } from '#/shared/components/brand/GrooveLoader'
import { CoverGlow } from '#/shared/components/CoverGlow'
import { RecordHeading } from '#/shared/components/RecordHeading'
import { SheetCover } from '#/shared/components/SheetCover'
import { recordCredits } from '#/shared/utils/artist-name'
import { releaseCoverKey } from '#/shared/utils/cover-key'
import { Button } from '#/shared/components/ui/button'
import { Dialog, DialogContent } from '#/shared/components/ui/dialog'
import { Drawer, DrawerContent } from '#/shared/components/ui/drawer'
import { useIsMobile } from '#/shared/hooks/use-is-mobile'
import { useRecordCover } from '#/shared/hooks/use-record-cover'
import { CollectionIcon } from '#/shared/components/icons/CollectionIcon'
import { RandomPickIcon } from '#/shared/components/icons/RandomPickIcon'

interface Props {
  record: CollectionRelease
  onClose: () => void
  onPickAgain?: () => void
  isPicking?: boolean
  /** The last Pick again failed */
  pickFailed?: boolean
  onRemove?: () => void
  isRemoving?: boolean
}

interface ContentProps extends Omit<Props, 'onClose'> {
  coverRef: React.Ref<HTMLDivElement>
}

const SpotlightContent = ({
  record,
  onPickAgain,
  isPicking,
  pickFailed,
  onRemove,
  isRemoving,
  coverRef,
}: ContentProps) => {
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
    // A new Random pick replaces the last one in a single fade
    <div
      className={`relative flex min-h-0 flex-col gap-5 overflow-y-auto ${onPickAgain ? 'duration-160 ease-fade animate-in fade-in-0' : ''}`}
    >
      <SheetCover
        ref={coverRef}
        coverKey={releaseCoverKey(record.id, info.master_id)}
        artist={leadArtist(info.artists)}
        credits={recordCredits(info.artists)}
        title={info.title}
        styles={info.styles}
      />

      <RecordHeading
        artist={formatArtists(info.artists)}
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

      {/* Bottom padding inside the scroller, so button shadows aren't clipped */}
      <div className="flex flex-col items-center gap-2 pt-1 pb-6">
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
        {!onRemove && pickFailed && (
          <p role="alert" className="m-0 text-sm text-foreground">
            Couldn't reach Discogs. Try again.
          </p>
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
  pickFailed,
  onRemove,
  isRemoving,
}: Props) => {
  const isMobile = useIsMobile()
  const { tint, sheetCover, flyBack } = useRecordCover(record)

  const handleClose = () => {
    flyBack()
    onClose()
  }

  if (isMobile) {
    return (
      <Drawer open onOpenChange={handleClose}>
        <DrawerContent
          className="sheet-fade px-6 pt-6"
          style={{ '--cover-tint': tint ?? undefined }}
        >
          <CoverGlow tint={tint} />
          <SpotlightContent
            key={record.id}
            record={record}
            coverRef={sheetCover}
            onPickAgain={onPickAgain}
            isPicking={isPicking}
            pickFailed={pickFailed}
            onRemove={onRemove}
            isRemoving={isRemoving}
          />
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog open onOpenChange={handleClose}>
      <DialogContent
        className="flex max-h-[90dvh] flex-col gap-0 overflow-hidden px-6 pt-6"
        style={{ '--cover-tint': tint ?? undefined }}
        showCloseButton={false}
      >
        <CoverGlow tint={tint} />
        <SpotlightContent
          key={record.id}
          record={record}
          coverRef={sheetCover}
          onPickAgain={onPickAgain}
          isPicking={isPicking}
          pickFailed={pickFailed}
          onRemove={onRemove}
          isRemoving={isRemoving}
        />
      </DialogContent>
    </Dialog>
  )
}
