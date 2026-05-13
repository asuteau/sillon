import {
  formatArtists,
  formatDateAdded,
} from '#/features/collection/collection.utils'
import { CoverArt } from '#/shared/components/CoverArt'
import { Button } from '#/shared/components/ui/button'
import { Dialog, DialogContent } from '#/shared/components/ui/dialog'
import { Sheet, SheetContent } from '#/shared/components/ui/sheet'
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
  return (
    <div className="flex flex-col gap-5">
      <CoverArt
        key={release.id}
        releaseId={String(release.id)}
        artist={info.artists[0]?.name ?? ''}
        title={info.title}
        thumb={info.thumb}
        styles={info.styles}
        className="w-full aspect-square rounded-2xl overflow-hidden"
      />

      <div className="flex flex-col items-center gap-2 text-center">
        <p className="island-kicker">{formatArtists(info.artists)}</p>
        <h2 className="display-title text-2xl font-bold tracking-tight text-(--sea-ink)">
          {info.title}
        </h2>
        <dl className="flex gap-4 font-mono text-sm text-(--sea-ink-soft)">
          {info.year > 0 && (
            <div className="flex gap-1.5">
              <dt>Year</dt>
              <dd>{info.year}</dd>
            </div>
          )}
          <div className="flex gap-1.5">
            <dt>Added</dt>
            <dd>{formatDateAdded(release.date_added)}</dd>
          </div>
        </dl>
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
      <Sheet open onOpenChange={onClose}>
        <SheetContent
          side="bottom"
          className="h-[90dvh] border-0 bg-transparent p-4 shadow-none"
          showCloseButton={false}
        >
          <div className="island-shell h-full overflow-y-auto rounded-t-3xl p-6">
            <ReleaseSheetContent
              release={release}
              onRemove={onRemove}
              isRemoving={isRemoving}
              removeLabel={removeLabel}
              removeIcon={removeIcon}
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
