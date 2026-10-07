import {
  formatArtists,
  formatDateAdded,
} from '#/features/collection/collection.utils'
import { MarketplaceSection } from '#/features/marketplace/components/MarketplaceSection'
import { RecordHeading } from '#/shared/components/RecordHeading'
import { SheetCover } from '#/shared/components/SheetCover'
import { releaseCoverKey } from '#/shared/utils/cover-key'
import { Button } from '#/shared/components/ui/button'
import { Dialog, DialogContent } from '#/shared/components/ui/dialog'
import { Drawer, DrawerContent } from '#/shared/components/ui/drawer'
import { useAnimatedClose } from '#/shared/hooks/use-animated-close'
import { useIsMobile } from '#/shared/hooks/use-is-mobile'

interface ReleaseInfo {
  id: number
  date_added: string
  basic_information: {
    master_id?: number
    title: string
    year: number
    artists: { name: string }[]
    cover_image: string
    thumb: string
    styles: string[]
    formats?: {
      name: string
      qty?: string
      descriptions?: string[]
      text?: string
    }[]
    labels?: { name: string; catno?: string }[]
  }
}

interface Props {
  release: ReleaseInfo
  onClose: () => void
  onRemove: () => void
  isRemoving?: boolean
  removeLabel: string
  removeIcon: React.ReactNode
}

function ReleaseSheetContent({
  release,
  onRemove,
  isRemoving,
  removeLabel,
  removeIcon,
}: Omit<Props, 'onClose'>) {
  const { basic_information: info } = release
  const fmt = info.formats?.[0]
  const formatParts = fmt
    ? [fmt.name, ...(fmt.descriptions ?? []), fmt.text].filter(Boolean)
    : []
  const label = info.labels?.[0]
  const catno =
    label?.catno && label.catno.toLowerCase() !== 'none' ? label.catno : null
  const labelText = label
    ? [label.name, catno].filter(Boolean).join(' · ')
    : null

  return (
    <div className="flex min-h-0 flex-col gap-5 overflow-y-auto">
      <SheetCover
        key={release.id}
        coverKey={releaseCoverKey(release.id, info.master_id)}
        artist={info.artists[0]?.name ?? ''}
        title={info.title}
        thumb={info.thumb}
        styles={info.styles}
      />

      <RecordHeading
        artist={formatArtists(info.artists)}
        title={info.title}
        catalogue={[
          [
            info.year > 0 ? String(info.year) : null,
            formatDateAdded(release.date_added),
          ]
            .filter(Boolean)
            .join(' · '),
          formatParts.join(' · '),
          labelText,
        ]}
      />

      <MarketplaceSection releaseId={release.id} />

      <div className="flex justify-center pt-1">
        <Button variant="destructive" disabled={isRemoving} onClick={onRemove}>
          {removeIcon}
          {removeLabel}
        </Button>
      </div>
    </div>
  )
}

export function ReleaseSheet({
  release,
  onClose,
  onRemove,
  isRemoving,
  removeLabel,
  removeIcon,
}: Props) {
  const isMobile = useIsMobile()
  const { open, onOpenChange, onAnimationEnd } = useAnimatedClose(onClose)

  if (isMobile) {
    return (
      <Drawer
        open={open}
        onOpenChange={onOpenChange}
        onAnimationEnd={onAnimationEnd}
      >
        <DrawerContent className="p-6">
          <ReleaseSheetContent
            release={release}
            onRemove={onRemove}
            isRemoving={isRemoving}
            removeLabel={removeLabel}
            removeIcon={removeIcon}
          />
        </DrawerContent>
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
        <ReleaseSheetContent
          release={release}
          onRemove={onRemove}
          isRemoving={isRemoving}
          removeLabel={removeLabel}
          removeIcon={removeIcon}
        />
      </DialogContent>
    </Dialog>
  )
}
