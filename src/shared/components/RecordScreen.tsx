import { useState } from 'react'

import type { ReleaseFormat } from '#/features/collection/collection.schema'
import {
  formatArtists,
  formatDateAdded,
  leadArtist,
} from '#/features/collection/collection.utils'
import { MarketplaceSection } from '#/features/marketplace/components/MarketplaceSection'
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

// A Collection Copy or a Wantlist entry: both carry the Release this way
export interface RecordScreenRecord {
  id: number
  date_added: string
  basic_information: {
    master_id?: number
    title: string
    year: number
    artists: { name: string; anv?: string }[]
    styles: string[]
    formats: ReleaseFormat[]
    labels: { name: string; catno?: string }[]
  }
}

interface RecordScreenProps {
  record: RecordScreenRecord
  /** Runs once the screen has finished closing */
  onClose: () => void
  /** The screen's actions: Remove, or Pick again */
  actions: React.ReactNode
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

  return (
    <div
      className={`relative flex min-h-0 flex-col gap-5 overflow-y-auto ${isReplacement ? 'duration-160 ease-fade animate-in fade-in-0' : ''}`}
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
// Collection, Wantlist): drawer on mobile, dialog on desktop, closing with
// its exit animation
export const RecordScreen = ({
  record,
  onClose,
  actions,
}: RecordScreenProps) => {
  const isMobile = useIsMobile()
  const { open, onOpenChange, onAnimationEnd } = useAnimatedClose(onClose)
  const { tint, sheetCover, flyBack } = useRecordCover(record)
  // Random pick swaps the record in place
  const [firstId] = useState(record.id)

  const handleOpenChange = (next: boolean) => {
    if (!next) flyBack()
    onOpenChange(next)
  }

  const content = (
    <>
      <CoverGlow tint={tint} />
      <RecordScreenContent
        key={record.id}
        record={record}
        actions={actions}
        coverRef={sheetCover}
        isReplacement={record.id !== firstId}
      />
    </>
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
