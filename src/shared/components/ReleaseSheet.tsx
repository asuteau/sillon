import {
  formatArtists,
  formatDateAdded,
} from '#/features/collection/collection.utils'
import { SheetCover } from '#/shared/components/SheetCover'
import { Button } from '#/shared/components/ui/button'
import { Dialog, DialogContent } from '#/shared/components/ui/dialog'
import { Drawer, DrawerContent } from '#/shared/components/ui/drawer'
import { useIsMobile } from '#/shared/hooks/use-is-mobile'

interface ReleaseInfo {
  id: number
  date_added: string
  basic_information: {
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
        releaseId={String(release.id)}
        artist={info.artists[0]?.name ?? ''}
        title={info.title}
        thumb={info.thumb}
        styles={info.styles}
      />

      <div className="flex flex-col items-center gap-2 text-center">
        <p className="island-kicker">{formatArtists(info.artists)}</p>
        <h2 className="display-title text-2xl font-bold tracking-tight text-(--sea-ink)">
          {info.title}
        </h2>
        <p className="flex flex-wrap justify-center items-center gap-x-3 gap-y-1 font-mono text-sm text-(--sea-ink-soft)">
          {info.year > 0 && <span>{info.year}</span>}
          {info.year > 0 && <span aria-hidden>·</span>}
          <span>{formatDateAdded(release.date_added)}</span>
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
        <Button
          variant="destructive"
          className="rounded-full"
          disabled={isRemoving}
          onClick={onRemove}
        >
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

  if (isMobile) {
    return (
      <Drawer open onOpenChange={onClose}>
        <DrawerContent className="island-shell p-6">
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
    <Dialog open onOpenChange={onClose}>
      <DialogContent
        className="max-w-sm rounded-none border-0 bg-transparent p-0 ring-0 shadow-none"
        showCloseButton={false}
      >
        <div className="island-shell flex max-h-[90dvh] flex-col overflow-hidden rounded-3xl p-6">
          <ReleaseSheetContent
            release={release}
            onRemove={onRemove}
            isRemoving={isRemoving}
            removeLabel={removeLabel}
            removeIcon={removeIcon}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
