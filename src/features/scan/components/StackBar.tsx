import { useState } from 'react'
import { X } from 'lucide-react'

import { CollectionIcon } from '#/shared/components/icons/CollectionIcon'
import { WantlistIcon } from '#/shared/components/icons/WantlistIcon'
import { Button } from '#/shared/components/ui/button'

import type { StackList, StackSummary } from '../stack.model'

export const LIST_NAMES: Record<StackList, string> = {
  collection: 'Collection',
  wantlist: 'Wantlist',
}

export const OTHER_LIST: Record<StackList, StackList> = {
  collection: 'wantlist',
  wantlist: 'collection',
}

export const plural = (count: number, one: string, many = `${one}s`) =>
  `${count} ${count === 1 ? one : many}`

interface StackBarProps {
  list: StackList
  summary: StackSummary
  /** What's left out: already in the list, to choose, failed */
  notes: string[]
  recordCount: number
  isCommitting: boolean
  isPaused: boolean
  onConfirm: () => void
  /** Opens the next Unresolved record's chooser */
  onChooseNext: () => void
  onSwitchList: () => void
  onClear: () => void
  onClose: () => void
}

interface StackBarNotesArgs {
  list: StackList
  summary: StackSummary
  failedCount: number
  isCommitting: boolean
}

/** What the bar notes is left out: already in the list, to choose, failed */
export const stackBarNotes = ({
  list,
  summary,
  failedCount,
  isCommitting,
}: StackBarNotesArgs): string[] =>
  [
    summary.alreadyIn > 0 &&
      `${summary.alreadyIn} already in ${LIST_NAMES[list]}`,
    // With nothing ready to add, choosing is the bar's own action
    summary.unresolved > 0 &&
      summary.toAdd > 0 &&
      `${summary.unresolved} to choose`,
    failedCount > 0 &&
      !isCommitting &&
      `${plural(failedCount, 'record')} couldn't be added`,
  ].filter((note) => typeof note === 'string')

const confirmLabel = ({
  list,
  summary,
  isCommitting,
  isPaused,
}: Pick<StackBarProps, 'list' | 'summary' | 'isCommitting' | 'isPaused'>) => {
  if (isPaused) return 'Pausing for Discogs…'
  if (isCommitting) return `Adding to ${LIST_NAMES[list]}…`
  return `Add ${summary.toAdd} to ${LIST_NAMES[list]}`
}

interface StackBarActionProps extends Pick<
  StackBarProps,
  | 'list'
  | 'summary'
  | 'isCommitting'
  | 'isPaused'
  | 'onConfirm'
  | 'onChooseNext'
> {}

// The bar's main action is always one that can be taken: add what's ready,
// else choose a release, else nothing (everything is already in the list)
const StackBarAction = ({
  list,
  summary,
  isCommitting,
  isPaused,
  onConfirm,
  onChooseNext,
}: StackBarActionProps) => {
  if (summary.toAdd === 0 && !isCommitting) {
    if (summary.unresolved === 0) return null
    return (
      <Button size="lg" className="w-full" onClick={onChooseNext}>
        {summary.unresolved === 1
          ? 'Choose the release'
          : `Choose ${summary.unresolved} releases`}
      </Button>
    )
  }

  return (
    <Button
      size="lg"
      className="w-full"
      disabled={isCommitting}
      onClick={onConfirm}
    >
      {list === 'collection' ? <CollectionIcon /> : <WantlistIcon />}
      {confirmLabel({ list, summary, isCommitting, isPaused })}
    </Button>
  )
}

// Pinned under the Stack: confirm it, send it to the other list, or clear it
export const StackBar = ({
  list,
  summary,
  notes,
  recordCount,
  isCommitting,
  isPaused,
  onConfirm,
  onChooseNext,
  onSwitchList,
  onClear,
  onClose,
}: StackBarProps) => {
  const [isConfirmingClear, setIsConfirmingClear] = useState(false)
  const otherList = OTHER_LIST[list]

  return (
    <div className="flex shrink-0 flex-col gap-2">
      {notes.length > 0 && (
        <p className="text-center text-xs text-muted-foreground">
          {notes.join(' · ')}
        </p>
      )}
      <StackBarAction
        list={list}
        summary={summary}
        isCommitting={isCommitting}
        isPaused={isPaused}
        onConfirm={onConfirm}
        onChooseNext={onChooseNext}
      />

      {isConfirmingClear ? (
        <div className="flex items-center gap-2">
          <span className="flex-1 text-sm text-muted-foreground">
            Clear {plural(recordCount, 'record')}?
          </span>
          <Button variant="outline" onClick={() => setIsConfirmingClear(false)}>
            Keep
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              onClear()
              setIsConfirmingClear(false)
            }}
          >
            Clear
          </Button>
        </div>
      ) : (
        <div className="flex gap-2">
          {/* Only once a record's release is known can a list take it */}
          {summary.toAdd + summary.alreadyIn > 0 && (
            <Button
              variant="ghost"
              className="flex-1"
              disabled={isCommitting}
              onClick={onSwitchList}
            >
              To {LIST_NAMES[otherList]} instead
            </Button>
          )}
          <Button
            variant="ghost"
            className="flex-1"
            disabled={isCommitting}
            onClick={() => setIsConfirmingClear(true)}
          >
            Clear stack
          </Button>
          <Button variant="ghost" onClick={onClose} aria-label="Close">
            <X />
          </Button>
        </div>
      )}
    </div>
  )
}
