import { GrooveLoader } from '#/shared/components/brand/GrooveLoader'
import { CoverArt } from '#/shared/components/CoverArt'
import {
  RECORD_ROW_MEDIA_CLASSES,
  RecordRow,
} from '#/shared/components/RecordList'
import { releaseCoverKey } from '#/shared/utils/cover-key'
import { cn } from '#/shared/utils/cn'

import type { AddState } from '../hooks/use-stack-commit'
import { chosenPressing, isInList } from '../stack.model'
import type { Pressing, StackList, StackRecord } from '../stack.model'

const LIST_NAMES: Record<StackList, string> = {
  collection: 'Collection',
  wantlist: 'Wantlist',
}

/** Year · label · cat no: what tells one pressing from another */
export const pressingDetails = (pressing: Pressing) =>
  [
    pressing.year > 0 ? String(pressing.year) : null,
    pressing.country,
    pressing.label,
    pressing.catno,
  ]
    .filter(Boolean)
    .join(' · ')

const PressingCover = ({ pressing }: { pressing: Pressing }) => (
  <CoverArt
    coverKey={releaseCoverKey(pressing.id, pressing.masterId)}
    artist={pressing.artist}
    credits={pressing.credits}
    title={pressing.title}
    styles={[]}
    className={RECORD_ROW_MEDIA_CLASSES}
  />
)

const Mark = ({ children }: { children: React.ReactNode }) => (
  <span className="shrink-0 rounded-full border border-border px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
    {children}
  </span>
)

interface StackRowProps {
  record: StackRecord
  list: StackList
  addState: AddState | undefined
  /** Lights the row up: it was just scanned again */
  highlightKey: number | undefined
  onClick: () => void
}

export const StackRow = ({
  record,
  list,
  addState,
  highlightKey,
  onClick,
}: StackRowProps) => {
  const pressing = chosenPressing(record)
  const isLeftOut =
    record.status === 'found' &&
    pressing !== null &&
    isInList(pressing, list) &&
    !record.included

  return (
    <li
      key={highlightKey}
      className={cn(
        'transition-opacity duration-160 ease-fade',
        highlightKey !== undefined && 'stack-row-seen',
        isLeftOut && 'opacity-50',
      )}
    >
      <StackRowContent
        record={record}
        list={list}
        addState={addState}
        isLeftOut={isLeftOut}
        onClick={onClick}
      />
    </li>
  )
}

interface StackRowContentProps {
  record: StackRecord
  list: StackList
  addState: AddState | undefined
  isLeftOut: boolean
  onClick: () => void
}

const StackRowContent = ({
  record,
  list,
  addState,
  isLeftOut,
  onClick,
}: StackRowContentProps) => {
  if (record.status === 'looking-up') {
    return (
      <RecordRow
        onClick={onClick}
        media={
          <span
            className={cn(
              RECORD_ROW_MEDIA_CLASSES,
              'flex items-center justify-center bg-muted',
            )}
          >
            <GrooveLoader size={20} />
          </span>
        }
        title="Looking up…"
        meta={record.barcode}
      />
    )
  }

  if (record.status === 'lookup-failed') {
    return (
      <RecordRow
        onClick={onClick}
        media={<span className={cn(RECORD_ROW_MEDIA_CLASSES, 'bg-muted')} />}
        title="Couldn't look up"
        description="Scan it again to retry"
        meta={record.barcode}
      />
    )
  }

  const pressing = chosenPressing(record)

  // Unresolved: the first pressing stands in until one is chosen
  if (!pressing) {
    const [first] = record.pressings
    return (
      <RecordRow
        onClick={onClick}
        media={<PressingCover pressing={first} />}
        artist={first.artist}
        title={first.title}
        description={`${record.pressings.length} pressings — choose`}
      />
    )
  }

  return (
    <RecordRow
      onClick={onClick}
      media={<PressingCover pressing={pressing} />}
      artist={pressing.artist}
      title={pressing.title}
      description={pressingDetails(pressing)}
      badges={
        addState === 'adding' ? (
          <GrooveLoader size={20} />
        ) : addState === 'failed' ? (
          <Mark>Failed</Mark>
        ) : isLeftOut ? (
          <Mark>In {LIST_NAMES[list]}</Mark>
        ) : record.included ? (
          <Mark>Another copy</Mark>
        ) : list === 'collection' && pressing.inWantlist ? (
          <Mark>Wanted</Mark>
        ) : null
      }
    />
  )
}
