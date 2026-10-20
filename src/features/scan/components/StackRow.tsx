import { GrooveLoader } from '#/shared/components/brand/GrooveLoader'
import { CoverArt } from '#/shared/components/CoverArt'
import {
  RECORD_ROW_MEDIA_CLASSES,
  RecordRow,
} from '#/shared/components/RecordList'
import { releaseCoverKey } from '#/shared/utils/cover-key'
import { Chip } from '#/shared/components/ui/chip'
import { cn } from '#/shared/utils/cn'

import type { AddState } from '../hooks/use-stack-commit'
import { chosenRelease, isInList } from '../stack.model'
import type { ReleaseMatch, StackList, StackRecord } from '../stack.model'

const LIST_NAMES: Record<StackList, string> = {
  collection: 'Collection',
  wantlist: 'Wantlist',
}

/** Year · label · cat no: what tells one release from another */
export const releaseDetails = (release: ReleaseMatch) =>
  [
    release.year > 0 ? String(release.year) : null,
    release.country,
    release.label,
    release.catno,
  ]
    .filter(Boolean)
    .join(' · ')

const releaseCover = (release: ReleaseMatch) => (
  <CoverArt
    coverKey={releaseCoverKey(release.id, release.masterId)}
    artist={release.artist}
    credits={release.credits}
    title={release.title}
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
  onToggleIncluded: () => void
  onRetry: () => void
  /** Records are being added: one can't be retried meanwhile */
  isCommitting: boolean
  /** The release's Cover: its cover art, unless a still shows a House sleeve */
  renderCover?: (release: ReleaseMatch) => React.ReactNode
}

export const StackRow = ({
  record,
  list,
  addState,
  highlightKey,
  onClick,
  onToggleIncluded,
  onRetry,
  isCommitting,
  renderCover = releaseCover,
}: StackRowProps) => {
  const release = chosenRelease(record)
  const isInTheList =
    record.status === 'found' && release !== null && isInList(release, list)
  const isLeftOut = isInTheList && !record.included

  return (
    <li
      key={highlightKey}
      className={cn(
        'flex items-center gap-2',
        highlightKey !== undefined && 'stack-row-seen',
      )}
    >
      <div
        className={cn(
          'min-w-0 flex-1 transition-opacity duration-160 ease-fade',
          isLeftOut && 'opacity-50',
        )}
      >
        <StackRowContent
          record={record}
          list={list}
          addState={addState}
          isLeftOut={isLeftOut}
          onClick={onClick}
          renderCover={renderCover}
        />
      </div>
      {addState === 'failed' && (
        <Chip
          onClick={onRetry}
          disabled={isCommitting}
          className="shrink-0 px-2.5 py-1 text-xs"
        >
          Retry
        </Chip>
      )}
      {/* Already in the list: left out, unless the user owns another copy */}
      {isInTheList && !addState && (
        <Chip
          active={!isLeftOut}
          onClick={onToggleIncluded}
          className="shrink-0 px-2.5 py-1 text-xs"
        >
          {isLeftOut ? 'Add anyway' : 'Adding'}
        </Chip>
      )}
    </li>
  )
}

interface StackRowContentProps {
  record: StackRecord
  list: StackList
  addState: AddState | undefined
  isLeftOut: boolean
  onClick: () => void
  renderCover: (release: ReleaseMatch) => React.ReactNode
}

const StackRowContent = ({
  record,
  list,
  addState,
  isLeftOut,
  onClick,
  renderCover,
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

  const release = chosenRelease(record)

  // Unresolved: the first release stands in until one is chosen
  if (!release) {
    const [first] = record.matches
    return (
      <RecordRow
        onClick={onClick}
        media={renderCover(first)}
        artist={first.artist}
        title={first.title}
        description={`${record.matches.length} releases — choose`}
      />
    )
  }

  return (
    <RecordRow
      onClick={onClick}
      media={renderCover(release)}
      artist={release.artist}
      title={release.title}
      description={
        isLeftOut
          ? `In your ${LIST_NAMES[list]}`
          : record.included
            ? ['Another copy', releaseDetails(release)]
                .filter(Boolean)
                .join(' · ')
            : releaseDetails(release)
      }
      badges={
        addState === 'adding' ? (
          <GrooveLoader size={20} />
        ) : list === 'collection' && release.inWantlist ? (
          <Mark>Wanted</Mark>
        ) : null
      }
    />
  )
}
