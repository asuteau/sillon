import type { CollectionRelease } from '#/features/collection/collection.schema'
import {
  formatArtists,
  formatDateAdded,
  leadArtist,
} from '#/features/collection/collection.utils'
import { discSurface } from '#/features/collection/disc-surface.utils'
import { useSleevePull } from '#/features/collection/hooks/use-sleeve-pull'
import { slidePosition } from '#/features/collection/sleeve-pull.utils'
import { vinylColour } from '#/features/collection/vinyl-colour.utils'
import { Disc } from '#/shared/components/brand/Disc'
import { CoverArt } from '#/shared/components/CoverArt'
import { Button } from '#/shared/components/ui/button'
import { useCoverTint } from '#/shared/hooks/use-cover-tint'
import { recordCredits } from '#/shared/utils/artist-name'
import { releaseCoverKey } from '#/shared/utils/cover-key'
import { setCoverOrigin } from '#/shared/utils/cover-transition'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { useMemo, useState } from 'react'

const coverInput = (record: CollectionRelease) => {
  const { basic_information: info } = record
  return {
    coverKey: releaseCoverKey(record.id, info.master_id),
    credits: recordCredits(info.artists),
    title: info.title,
  }
}

interface SlideProps {
  record: CollectionRelease
  slideRef: (node: HTMLElement | null) => void
  isCentred: boolean
  onSelect: (cover: HTMLElement | null) => void
}

const Slide = ({ record, slideRef, isCentred, onSelect }: SlideProps) => {
  const { basic_information: info } = record
  const cover = coverInput(record)
  const coverArt = {
    ...cover,
    artist: leadArtist(info.artists),
    styles: info.styles,
  }
  // The disc's label; grey (the root --cover-tint) until known
  const tint = useCoverTint(cover)
  // The Release's Vinyl colour, the same every time for this Release
  const surface = useMemo(
    () => discSurface(vinylColour(info.formats), record.id),
    [info.formats, record.id],
  )

  return (
    <button
      ref={slideRef}
      type="button"
      className="sleeve-pull-slide"
      // One stop in the tab order: the centred record
      tabIndex={isCentred ? 0 : -1}
      aria-current={isCentred || undefined}
      aria-label={`${formatArtists(info.artists)} – ${info.title}`}
      style={{ '--cover-tint': tint ?? undefined }}
      onClick={(event) =>
        onSelect(
          // The sleeve's Cover, not a picture disc's
          event.currentTarget.querySelector<HTMLElement>(
            '[data-slot="sleeve"] [data-slot="cover"]',
          ),
        )
      }
    >
      <span className="sleeve-pull-body">
        <Disc
          surface={surface.background}
          seeThrough={surface.seeThrough}
          picture={
            surface.picture && <CoverArt {...coverArt} className="size-full" />
          }
        />
        <span data-slot="sleeve" className="sleeve-pull-sleeve">
          <CoverArt
            {...coverArt}
            className="size-full overflow-hidden rounded-(--radius)"
          />
        </span>
      </span>
    </button>
  )
}

interface CaptionProps {
  record: CollectionRelease
  index: number
  count: number
}

// Cross-fades from one record to the next (keyed by the caller)
const Caption = ({ record, index, count }: CaptionProps) => {
  const { basic_information: info } = record

  return (
    <div className="flex min-w-0 flex-1 animate-in flex-col items-center gap-1 text-center duration-160 ease-fade fade-in-0">
      <span className="type-caps max-w-full truncate text-[11px] text-muted-foreground">
        {formatArtists(info.artists)}
      </span>
      <span className="type-title max-w-full truncate text-xl text-foreground">
        {info.title}
      </span>
      <span className="type-catalogue text-[11px] text-muted-foreground">
        {slidePosition(index, count)} · Added{' '}
        {formatDateAdded(record.date_added)}
      </span>
    </div>
  )
}

interface SleevePullProps {
  /** Recent additions, newest first */
  records: CollectionRelease[]
  /** The centred record's screen is open: its disc stays tucked */
  isOpen: boolean
  onOpen: (record: CollectionRelease) => void
}

// Signature 3 — Sleeve pull: a strip of sleeves; the centred sleeve and its
// disc part around the centre as it settles. See design system §5.
export const SleevePull = ({ records, isOpen, onOpen }: SleevePullProps) => {
  const ids = useMemo(() => records.map((r) => r.instance_id), [records])
  const { stripRef, slideRef, centred, glideTo } = useSleevePull(ids)
  const centredRecord = records.at(centred) ?? records[0]
  // Back from the record screen, the disc waits for the Cover to land; after
  // a removal there is no flight back, so the next record's disc comes out
  const [openedId, setOpenedId] = useState<number | null>(null)
  if (isOpen && openedId !== centredRecord.instance_id)
    setOpenedId(centredRecord.instance_id)
  // Opens pulled out, the skeleton's pose, so nothing moves as it fades in
  const tuck = isOpen
    ? 'in'
    : openedId === centredRecord.instance_id
      ? 'returning'
      : 'out'

  const handleKeyDown = (event: React.KeyboardEvent) => {
    const delta =
      event.key === 'ArrowLeft' ? -1 : event.key === 'ArrowRight' ? 1 : 0
    if (!delta) return
    event.preventDefault()
    glideTo(centred + delta, { focus: true })
  }

  return (
    <div className="animate-in duration-160 ease-fade fade-in-0">
      <div
        ref={stripRef}
        role="group"
        aria-roledescription="carousel"
        aria-label="Recent additions"
        data-tuck={tuck}
        className="sleeve-pull-strip -mx-4 min-[900px]:mx-0"
        onKeyDown={handleKeyDown}
      >
        <span aria-hidden className="sleeve-pull-spacer" />
        {records.map((record, index) => (
          <Slide
            key={record.instance_id}
            record={record}
            slideRef={slideRef(record.instance_id)}
            isCentred={index === centred}
            onSelect={(cover) => {
              // A neighbour comes to the centre; the centred record opens
              if (index !== centred) return glideTo(index)
              // The record screen grows from this sleeve
              setCoverOrigin(cover)
              onOpen(record)
            }}
          />
        ))}
        <span aria-hidden className="sleeve-pull-spacer" />
      </div>

      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon-lg"
          className="hidden sm:inline-flex"
          aria-label="Previous record"
          disabled={centred === 0}
          onClick={() => glideTo(centred - 1)}
        >
          <ArrowLeft />
        </Button>
        <Caption
          key={centredRecord.instance_id}
          record={centredRecord}
          index={centred}
          count={records.length}
        />
        <Button
          variant="outline"
          size="icon-lg"
          className="hidden sm:inline-flex"
          aria-label="Next record"
          disabled={centred === records.length - 1}
          onClick={() => glideTo(centred + 1)}
        >
          <ArrowRight />
        </Button>
      </div>
    </div>
  )
}
