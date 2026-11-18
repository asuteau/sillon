import type * as React from 'react'

import {
  LIST_NAMES,
  plural,
  StackBar,
  stackBarNotes,
} from '#/features/scan/components/StackBar'
import { StackRow } from '#/features/scan/components/StackRow'
import { stackSummary } from '#/features/scan/stack.model'
import type { ReleaseMatch, StackList } from '#/features/scan/stack.model'
import { CountBadge } from '#/shared/components/CountBadge'
import { CollectionIcon } from '#/shared/components/icons/CollectionIcon'
import { WantlistIcon } from '#/shared/components/icons/WantlistIcon'
import {
  RECORD_ROW_MEDIA_CLASSES,
  RecordList,
} from '#/shared/components/RecordList'
import { cn } from '#/shared/utils/cn'

import { GeneratedCover } from './GeneratedCover'
import {
  SCAN_LOOP_CRATE,
  SCAN_LOOP_SLEEVES,
  scanLoopStack,
} from '../content/landing-stack.content'
import { LANDING_RECORDS, landingPressing } from '../content/landing.content'
import { lookStyle } from '../film/film-css.utils'
import { NO_BEATS } from '../film/film.model'
import type { Shot } from '../film/film.model'
import { useFilmPlayer } from '../hooks/use-film-player'
import { CRATE_REST, crateRestLook, SCAN_SCORE } from '../scan.score'
import type { ScanTrack } from '../scan.score'
import { SleeveBack } from './SleeveBack'

const noop = () => {}

type Looks = Shot<ScanTrack>

interface TrackedProps {
  name: ScanTrack
  looks: Looks
  className?: string
  style?: React.CSSProperties
  children?: React.ReactNode
}

// One element the film moves (`data-track`, see useFilmPlayer)
const Tracked = ({ name, looks, className, style, children }: TrackedProps) => (
  <div
    data-track={name}
    className={className}
    style={{ ...style, ...lookStyle(looks[name] ?? {}) }}
  >
    {children}
  </div>
)

// Every sleeve shares one box, so they share the lens's vanishing point
const SLEEVE_BOX =
  'absolute top-[15cqw] left-[25cqw] size-[50cqw] [transform-style:preserve-3d]'
const SLEEVE_FACE =
  'absolute inset-0 rounded-(--radius) shadow-[0_10px_30px_var(--pull-shadow)]'

const recordAt = (index: number) => ({
  record: LANDING_RECORDS[index],
  seed: landingPressing(index).id,
})

interface CoverProps {
  index: number
  // How far back in the crate: the haze over it, 0 to 1
  haze?: number
}

const Cover = ({ index, haze = 0 }: CoverProps) => {
  const { record, seed } = recordAt(index)
  return (
    <div className={SLEEVE_FACE}>
      <GeneratedCover
        artist={record.artist}
        title={record.title}
        seed={seed}
        className="size-full"
      />
      {haze > 0 && (
        <div
          className="absolute inset-0 rounded-(--radius) bg-background"
          style={{ opacity: haze }}
        />
      )}
    </div>
  )
}

const PASSES = [
  { sleeve: 'a', list: 'collection' },
  { sleeve: 'b', list: 'wantlist' },
] as const

interface HeldProps {
  pass: 0 | 1
  looks: Looks
}

// A sleeve lifted out of the crate: its Cover, and on the other side its
// back with the barcode, where the light catches as it turns
const Held = ({ pass, looks }: HeldProps) => {
  const { sleeve } = PASSES[pass]
  const { index, barcode } = SCAN_LOOP_SLEEVES[pass]
  const { record } = recordAt(index)
  return (
    <Tracked name={`held:${sleeve}`} looks={looks} className={SLEEVE_BOX}>
      <Tracked
        name={`back:${sleeve}`}
        looks={looks}
        className={cn(SLEEVE_FACE, 'rotate-y-180')}
      >
        <SleeveBack
          artist={record.artist}
          title={record.title}
          label={record.label}
          catno={record.catno}
          barcode={barcode}
          className="size-full"
        />
        <Tracked
          name={`sheen:${sleeve}`}
          looks={looks}
          className="absolute inset-0 rounded-(--radius) bg-[linear-gradient(115deg,transparent_25%,rgb(255_255_255/0.75)_50%,transparent_75%)]"
        />
      </Tracked>
      <Tracked
        name={`front:${sleeve}`}
        looks={looks}
        className="absolute inset-0"
      >
        <Cover index={index} />
      </Tracked>
    </Tracked>
  )
}

const houseCover = (release: ReleaseMatch) => {
  const index = LANDING_RECORDS.findIndex((r) => r.title === release.title)
  return (
    <GeneratedCover
      artist={release.artist}
      title={release.title}
      seed={landingPressing(index).id}
      className={RECORD_ROW_MEDIA_CLASSES}
    />
  )
}

interface ListBarProps {
  stack: ReturnType<typeof scanLoopStack>
  list: StackList
}

const ListBar = ({ stack, list }: ListBarProps) => {
  const summary = stackSummary(stack, list)
  return (
    <StackBar
      list={list}
      summary={summary}
      notes={stackBarNotes({
        list,
        summary,
        failedCount: 0,
        isCommitting: false,
      })}
      recordCount={stack.records.length}
      isCommitting={false}
      isPaused={false}
      onConfirm={noop}
      onChooseNext={noop}
      onSwitchList={noop}
      onClear={noop}
      onClose={noop}
    />
  )
}

interface PanelProps {
  pass: 0 | 1
  looks: Looks
}

// The Stack of one under the viewfinder once Discogs answers, as the
// scanner shows it; the second pass switches it to the Wantlist
const Panel = ({ pass, looks }: PanelProps) => {
  const { sleeve } = PASSES[pass]
  const stack = scanLoopStack(pass)
  return (
    <Tracked
      name={`panel:${sleeve}`}
      looks={looks}
      className="absolute inset-x-[4cqw] bottom-[5cqw] flex flex-col gap-3 rounded-(--radius) border border-border bg-background p-3 shadow-[0_4px_12px_var(--pull-shadow)]"
    >
      <p className="type-caps flex items-center gap-2 text-[11px] text-muted-foreground">
        <span>Stack</span>
        <CountBadge count={stack.records.length} />
      </p>
      <RecordList>
        {stack.records.map((record) => (
          <StackRow
            key={record.barcode}
            record={record}
            list="collection"
            addState={undefined}
            highlightKey={undefined}
            onClick={noop}
            onToggleIncluded={noop}
            onRetry={noop}
            isCommitting={false}
            renderCover={houseCover}
          />
        ))}
      </RecordList>
      {pass === 0 ? (
        <ListBar stack={stack} list="collection" />
      ) : (
        <div className="grid *:col-start-1 *:row-start-1">
          <Tracked name="bar:collection" looks={looks}>
            <ListBar stack={stack} list="collection" />
          </Tracked>
          <Tracked name="bar:wantlist" looks={looks}>
            <ListBar stack={stack} list="wantlist" />
          </Tracked>
        </div>
      )}
    </Tracked>
  )
}

interface SentProps {
  pass: 0 | 1
  looks: Looks
}

// What the scanner says once the Stack is added
const Sent = ({ pass, looks }: SentProps) => {
  const { sleeve, list } = PASSES[pass]
  const Icon = list === 'collection' ? CollectionIcon : WantlistIcon
  return (
    <Tracked
      name={`sent:${sleeve}`}
      looks={looks}
      className="absolute inset-x-[4cqw] bottom-[14cqw] flex items-center justify-center gap-2 text-sm text-muted-foreground"
    >
      <Icon className="size-4" />
      <p>{`${plural(1, 'record')} added to your ${LIST_NAMES[list]}.`}</p>
    </Tracked>
  )
}

// On the paper sleeve, whichever the theme
const FINDER_CORNER = 'absolute size-[5cqw] border-vinyl-black'

// The Scan loop: in a shop, a sleeve lifted from the crate and turned to its
// barcode, scanned, matched on Discogs as a Stack of one, and added; the
// first to the Collection, the next to the Wantlist. Built from the app's
// own pieces; decorative and inert; plays only on screen, and holds one
// still frame with reduced motion.
export const ScanLoop = () => {
  const { stageRef, at } = useFilmPlayer(SCAN_SCORE, NO_BEATS)
  const looks = SCAN_SCORE.sample(at)

  return (
    <div
      ref={stageRef}
      data-slot="landing-loop"
      inert
      aria-hidden
      className="@container relative aspect-4/5 w-full min-w-0 overflow-hidden select-none"
    >
      {/* The camera on the crate; its edges fade into the page, so the
          crate's shadows never meet the frame */}
      <div className="absolute inset-0 mask-[linear-gradient(#000_78%,transparent)]">
        <Tracked
          name="set"
          looks={looks}
          className="absolute inset-0 origin-[50cqw_40cqw]"
        >
          {CRATE_REST.map((_, i) => (
            <div
              key={i}
              className={SLEEVE_BOX}
              style={lookStyle(crateRestLook(CRATE_REST.length - 1 - i))}
            >
              <Cover
                index={SCAN_LOOP_CRATE[CRATE_REST.length - 1 - i]}
                haze={0.55 - i * 0.2}
              />
            </div>
          ))}
          <Tracked name="crate:b" looks={looks} className={SLEEVE_BOX}>
            <Cover index={SCAN_LOOP_SLEEVES[1].index} haze={0.15} />
          </Tracked>
          <Tracked name="crate:a" looks={looks} className={SLEEVE_BOX}>
            <Cover index={SCAN_LOOP_SLEEVES[0].index} />
          </Tracked>
          <Held pass={0} looks={looks} />
          <Held pass={1} looks={looks} />
        </Tracked>
      </div>

      {/* The viewfinder, locked on the barcode */}
      <Tracked
        name="finder"
        looks={looks}
        className="absolute top-[50.5cqw] left-[32.5cqw] h-[19cqw] w-[34cqw]"
      >
        <span
          className={`${FINDER_CORNER} top-0 left-0 border-t-2 border-l-2`}
        />
        <span
          className={`${FINDER_CORNER} top-0 right-0 border-t-2 border-r-2`}
        />
        <span
          className={`${FINDER_CORNER} bottom-0 left-0 border-b-2 border-l-2`}
        />
        <span
          className={`${FINDER_CORNER} right-0 bottom-0 border-b-2 border-r-2`}
        />
        <Tracked
          name="flash"
          looks={looks}
          className="absolute inset-[1cqw] bg-white/70"
        />
      </Tracked>
      <Tracked
        name="scanline"
        looks={looks}
        className="absolute top-[52cqw] left-[calc(49.5cqw-1px)] h-[16cqw] w-0.5 bg-vinyl-black shadow-[0_0_6px_var(--color-vinyl-black)]"
      />

      <Panel pass={0} looks={looks} />
      <Panel pass={1} looks={looks} />
      <Sent pass={0} looks={looks} />
      <Sent pass={1} looks={looks} />
    </div>
  )
}
