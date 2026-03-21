import type { CollectionRelease } from '#/lib/recentAdditions'
import { Dialog, DialogContent } from '#/components/ui/dialog'
import { Sheet, SheetContent } from '#/components/ui/sheet'
import { Link } from '@tanstack/react-router'
import { Shuffle } from 'lucide-react'
import { useEffect, useState } from 'react'

function useIsMobile() {
  const [mobile, setMobile] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)')
    setMobile(mq.matches)
    const handler = (e: MediaQueryListEvent) => setMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])
  return mobile
}

interface Props {
  record: CollectionRelease
  onClose: () => void
  onPickAgain: () => void
  isPicking?: boolean
}

function SpotlightContent({ record, onClose, onPickAgain, isPicking }: Props) {
  const { basic_information: info } = record
  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute -bottom-16 -right-16 h-40 w-40 rounded-full bg-[radial-gradient(circle,rgba(47,106,74,0.18),transparent_66%)]" />

      <div className="relative flex flex-col gap-5">
        <img
          src={info.cover_image}
          alt={info.title}
          className="w-full aspect-square rounded-2xl object-cover"
        />

        <div className="flex flex-col gap-2">
          <p className="island-kicker">
            {info.artists.map((a) => a.name).join(', ')}
          </p>
          <h2 className="display-title text-2xl font-bold tracking-tight text-(--sea-ink)">
            {info.title}
          </h2>
          {info.year > 0 && (
            <p className="font-mono text-sm text-(--sea-ink-soft)">
              {info.year}
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
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
          <Link
            to="/collection/$id"
            params={{ id: String(record.id) }}
            onClick={onClose}
            className="flex items-center gap-1.5 rounded-full border border-[rgba(50,143,151,0.4)] bg-[rgba(79,184,178,0.14)] px-4 py-2 text-sm font-semibold text-(--lagoon-deep) no-underline hover:bg-[rgba(79,184,178,0.24)]"
          >
            View in collection →
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function RecordSpotlight({
  record,
  onClose,
  onPickAgain,
  isPicking,
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
            <SpotlightContent
              record={record}
              onClose={onClose}
              onPickAgain={onPickAgain}
              isPicking={isPicking}
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
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
