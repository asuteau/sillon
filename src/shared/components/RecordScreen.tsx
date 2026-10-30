import { useState } from 'react'

import type { ReleaseFormat } from '#/features/collection/collection.schema'
import {
  formatArtists,
  leadArtist,
} from '#/features/collection/collection.utils'
import { formatDateAdded } from '#/shared/utils/list-meta'
import { DiscRow } from '#/features/collection/components/DiscRow'
import { MarketplaceSection } from '#/features/marketplace/components/MarketplaceSection'
import { GrooveLoader } from '#/shared/components/brand/GrooveLoader'
import { CoverArt } from '#/shared/components/CoverArt'
import { CoverGlow } from '#/shared/components/CoverGlow'
import { DiscogsAttribution } from '#/shared/components/DiscogsAttribution'
import { RecordHeading } from '#/shared/components/RecordHeading'
import { SheetCover } from '#/shared/components/SheetCover'
import { Button } from '#/shared/components/ui/button'
import { Dialog, DialogContent } from '#/shared/components/ui/dialog'
import { Drawer, DrawerContent } from '#/shared/components/ui/drawer'
import { useAnimatedClose } from '#/shared/hooks/use-animated-close'
import { useIsMobile } from '#/shared/hooks/use-is-mobile'
import { useRecordCover } from '#/shared/hooks/use-record-cover'
import { recordCredits } from '#/shared/utils/artist-name'
import { releaseCoverKey } from '#/shared/utils/cover-key'
import { discogsReleaseUrl } from '#/shared/utils/discogs-urls'

// A Collection Copy, a Wantlist entry or a Release from Search: all carry the
// Release this way. Copies and wants have a date added; Search gives the
// country instead, to tell pressings apart
export interface RecordScreenRecord {
  id: number
  date_added?: string
  basic_information: {
    master_id?: number
    title: string
    year: number
    country?: string
    artists: { name: string; anv?: string }[]
    styles: string[]
    formats: ReleaseFormat[]
    labels: { name: string; catno?: string }[]
  }
}

/** The screen's actions: Remove, Pick again, or Add. A function gets `close`,
 * to close the screen with its exit animation */
type RecordScreenActions =
  React.ReactNode | ((close: () => void) => React.ReactNode)

interface RecordScreenProps {
  /** Undefined while the record is being prepared: the screen shows a loader */
  record: RecordScreenRecord | undefined
  /** Runs once the screen has finished closing */
  onClose: () => void
  actions: RecordScreenActions
}

interface ContentProps {
  record: RecordScreenRecord
  actions: React.ReactNode
  coverRef: React.Ref<HTMLDivElement>
  /** A new record replaced the first one shown: fade it in */
  isReplacement: boolean
}

const RecordScreenContent = ({
  record,
  actions,
  coverRef,
  isReplacement,
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

  const coverArt = {
    coverKey: releaseCoverKey(record.id, info.master_id),
    artist: leadArtist(info.artists),
    credits: recordCredits(info.artists),
    title: info.title,
    styles: info.styles,
  }

  return (
    <div
      className={`relative flex min-h-0 flex-col gap-5 overflow-y-auto ${isReplacement ? 'duration-160 ease-fade animate-in fade-in-0' : ''}`}
    >
      <SheetCover ref={coverRef} {...coverArt} />

      <RecordHeading
        artist={formatArtists(info.artists)}
        title={info.title}
        catalogue={[
          [
            info.year > 0 ? String(info.year) : null,
            info.country || null,
            record.date_added ? formatDateAdded(record.date_added) : null,
          ]
            .filter(Boolean)
            .join(' · '),
          formatParts.join(' · '),
          labelText,
        ]}
      />

      <DiscRow
        releaseId={record.id}
        formats={info.formats}
        picture={<CoverArt {...coverArt} className="size-full" />}
      />

      <MarketplaceSection releaseId={record.id} />

      <DiscogsAttribution
        href={discogsReleaseUrl(record.id)}
        className="mt-0 text-center"
      />

      {/* Bottom padding inside the scroller, so button shadows aren't clipped */}
      <div className="flex flex-col items-center gap-2 pt-1 pb-6">
        {actions}
      </div>
    </div>
  )
}

// The record screen, wherever a record opens from (Home, Random pick,
// Collection, Wantlist, Search): drawer on mobile, dialog on desktop, closing
// with its exit animation
export const RecordScreen = ({
  record,
  onClose,
  actions,
}: RecordScreenProps) => {
  const isMobile = useIsMobile()
  const { open, onOpenChange, onAnimationEnd } = useAnimatedClose(onClose)
  const { tint, sheetCover, flyBack } = useRecordCover(record)
  // Random pick swaps the record in place; a prepared one replaces the loader
  const [firstId] = useState(record?.id)

  const handleOpenChange = (next: boolean) => {
    if (!next) flyBack()
    onOpenChange(next)
  }

  const content = record ? (
    <>
      <CoverGlow tint={tint} />
      <RecordScreenContent
        key={record.id}
        record={record}
        actions={
          typeof actions === 'function'
            ? actions(() => handleOpenChange(false))
            : actions
        }
        coverRef={sheetCover}
        isReplacement={record.id !== firstId}
      />
    </>
  ) : (
    <div className="flex justify-center py-8">
      <GrooveLoader size={32} />
    </div>
  )

  if (isMobile) {
    return (
      <Drawer
        open={open}
        onOpenChange={handleOpenChange}
        onAnimationEnd={onAnimationEnd}
      >
        <DrawerContent
          className="sheet-fade px-6 pt-6"
          style={{ '--cover-tint': tint ?? undefined }}
        >
          {content}
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
      onOpenChangeComplete={onAnimationEnd}
    >
      <DialogContent
        className="flex max-h-[90dvh] flex-col gap-0 overflow-hidden px-6 pt-6"
        style={{ '--cover-tint': tint ?? undefined }}
        showCloseButton={false}
      >
        {content}
      </DialogContent>
    </Dialog>
  )
}

interface RemoveActionProps {
  label: string
  icon: React.ReactNode
  isRemoving: boolean
  onRemove: () => void
}

// The record screen's action for a record the user holds in a list
export const RemoveAction = ({
  label,
  icon,
  isRemoving,
  onRemove,
}: RemoveActionProps) => (
  <Button variant="destructive" disabled={isRemoving} onClick={onRemove}>
    {icon}
    {label}
  </Button>
)
