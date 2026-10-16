import { useState } from 'react'
import { AlertCircle, X } from 'lucide-react'

import { CollectionIcon } from '#/shared/components/icons/CollectionIcon'
import { ScanIcon } from '#/shared/components/icons/ScanIcon'
import { WantlistIcon } from '#/shared/components/icons/WantlistIcon'
import { RecordList } from '#/shared/components/RecordList'
import { Button } from '#/shared/components/ui/button'
import { Dialog, DialogContent } from '#/shared/components/ui/dialog'
import { Drawer, DrawerContent } from '#/shared/components/ui/drawer'
import { Input } from '#/shared/components/ui/input'
import { useIsMobile } from '#/shared/hooks/use-is-mobile'

import { useStackCommit } from '../hooks/use-stack-commit'
import { useStackScanner } from '../hooks/use-stack-scanner'
import type { CameraState } from '../hooks/use-scan-camera'
import {
  chooseRelease,
  chosenRelease,
  EMPTY_STACK,
  removeRecord,
  stackSummary,
  toggleIncluded,
} from '../stack.model'
import type {
  StackEntry,
  StackList,
  StackRecord,
  StackSummary,
} from '../stack.model'
import { updateStack, useStack } from '../stack.store'
import { FulfilledWantsPrompt } from './FulfilledWantsPrompt'
import { ReleaseChooser } from './ReleaseChooser'
import { StackRecordScreen } from './StackRecordScreen'
import { StackRow } from './StackRow'
import { Viewfinder } from './Viewfinder'

const LIST_NAMES: Record<StackList, string> = {
  collection: 'Collection',
  wantlist: 'Wantlist',
}

const OTHER_LIST: Record<StackList, StackList> = {
  collection: 'wantlist',
  wantlist: 'collection',
}

const plural = (count: number, one: string, many = `${one}s`) =>
  `${count} ${count === 1 ? one : many}`

interface DevBarcodeInputProps {
  onBarcode: (code: string) => void
}

// Dev only: type a barcode instead of pointing a camera
const DevBarcodeInput = ({ onBarcode }: DevBarcodeInputProps) => (
  <Input
    type="text"
    placeholder="Dev: enter barcode…"
    className="type-catalogue h-8 shrink-0 text-center text-xs sm:text-xs"
    onKeyDown={(e) => {
      if (e.key === 'Enter') {
        onBarcode(e.currentTarget.value)
        e.currentTarget.value = ''
      }
    }}
  />
)

interface CameraPanelProps {
  cameraState: CameraState
  onSearchManually?: () => void
  children: React.ReactNode
}

// The viewfinder, or why there is no camera to scan with
// Why there is nothing to scan with
const NO_CAMERA: Partial<
  Record<CameraState, { title: string; hint: string; icon: React.ReactNode }>
> = {
  blocked: {
    title: 'Camera access blocked',
    hint: 'Allow the camera for Sillon in your browser settings, or search manually.',
    icon: <ScanIcon className="size-10 text-muted-foreground" />,
  },
  unsupported: {
    title: 'No camera on this browser',
    hint: 'Search manually instead.',
    icon: <AlertCircle className="size-10 text-muted-foreground" />,
  },
  'no-reader': {
    title: "Couldn't start the barcode reader",
    hint: 'Check your connection and open Scan again, or search manually.',
    icon: <AlertCircle className="size-10 text-muted-foreground" />,
  },
}

const CameraPanel = ({
  cameraState,
  onSearchManually,
  children,
}: CameraPanelProps) => {
  const noCamera = NO_CAMERA[cameraState]

  if (noCamera) {
    return (
      <div className="flex shrink-0 flex-col items-center gap-4 py-2 text-center">
        {noCamera.icon}
        <div>
          <p className="type-title text-lg text-foreground">{noCamera.title}</p>
          <p className="mt-1 text-sm text-muted-foreground">{noCamera.hint}</p>
        </div>
        <Button variant="outline" onClick={onSearchManually}>
          Search manually →
        </Button>
      </div>
    )
  }

  return children
}

interface EmptyStackProps {
  /** A camera to scan with: worth saying how it works */
  canScan: boolean
  /** What the last confirm added, once the Stack has emptied */
  addedMessage: string | null
  /** Forgets the barcodes Discogs didn't know, when there are any */
  onClear?: () => void
  onClose: () => void
}

// Nothing to confirm: no bar, no list to switch to, just a way out
const EmptyStack = ({
  canScan,
  addedMessage,
  onClear,
  onClose,
}: EmptyStackProps) => (
  <>
    {(addedMessage || canScan) && (
      <p className="shrink-0 py-2 text-center text-sm text-muted-foreground">
        {addedMessage ?? 'Scan sleeves one after another: they pile up here.'}
      </p>
    )}
    <div className="flex shrink-0 justify-center gap-2">
      {onClear && (
        <Button variant="ghost" onClick={onClear}>
          Clear
        </Button>
      )}
      <Button variant="ghost" onClick={onClose}>
        <X />
        Close
      </Button>
    </div>
  </>
)

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
const StackBar = ({
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

interface StackScannerProps {
  onClose: () => void
  onSearchManually?: () => void
}

const StackScannerContent = ({
  onClose,
  onSearchManually,
}: StackScannerProps) => {
  const stack = useStack()
  const { cameraState, videoRef, flash, highlight, scanManually } =
    useStackScanner()
  const { addStates, failedCount, isCommitting, isPaused, commit } =
    useStackCommit()
  const [list, setList] = useState<StackList>('collection')
  const [addedCount, setAddedCount] = useState<number | null>(null)
  // The Unresolved record whose release is being chosen
  const [choosing, setChoosing] = useState<string | null>(null)
  // Records just added to the Collection that are still on the Wantlist
  const [fulfilledWants, setFulfilledWants] = useState<StackEntry[]>([])
  // The record open on the Record screen: kept as opened, so removing it
  // from the Stack doesn't pull the screen from under its exit animation
  const [opened, setOpened] = useState<{
    barcode: string
    releaseId: number
    canChangeRelease: boolean
  } | null>(null)
  const choosingRecord = stack.records.find(
    (r) => r.barcode === choosing && r.status === 'found',
  )

  const summary = stackSummary(stack, list)
  const canScan = cameraState === 'starting' || cameraState === 'live'

  const handleRowClick = (record: StackRecord) => {
    if (record.status !== 'found') return
    const release = chosenRelease(record)
    if (!release) return setChoosing(record.barcode)
    setOpened({
      barcode: record.barcode,
      releaseId: release.id,
      canChangeRelease: record.matches.length > 1,
    })
  }

  const handleChooseNext = () => {
    const next = stack.records.find(
      (r) => r.status === 'found' && r.chosenId === null,
    )
    if (next) setChoosing(next.barcode)
  }

  const handleChoose = (releaseId: number) => {
    if (choosing) updateStack((s) => chooseRelease(s, choosing, releaseId))
    setChoosing(null)
  }

  const handleConfirm = async (only?: string) => {
    try {
      const added = await commit(list, only)
      setAddedCount(added.length)
      if (list === 'collection') {
        setFulfilledWants(added.filter((e) => e.release.inWantlist))
      }
    } catch {
      // Rows that failed stay on the Stack, marked
    }
  }

  const notes = [
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

  return (
    <div className="flex min-h-0 flex-col gap-4">
      <CameraPanel
        cameraState={cameraState}
        onSearchManually={onSearchManually}
      >
        <Viewfinder
          cameraState={cameraState}
          videoRef={videoRef}
          flash={flash}
        />
      </CameraPanel>

      {import.meta.env.DEV && <DevBarcodeInput onBarcode={scanManually} />}

      {fulfilledWants.length > 0 ? (
        <FulfilledWantsPrompt
          wants={fulfilledWants}
          onResolved={() => setFulfilledWants([])}
        />
      ) : choosingRecord?.status === 'found' ? (
        <ReleaseChooser
          matches={choosingRecord.matches}
          chosenId={choosingRecord.chosenId}
          onChoose={handleChoose}
          onBack={() => setChoosing(null)}
        />
      ) : (
        <>
          {summary.notFound > 0 && (
            <p className="shrink-0 text-center text-xs text-muted-foreground">
              {plural(summary.notFound, 'barcode')} not on Discogs —{' '}
              <button
                type="button"
                onClick={onSearchManually}
                className="cursor-pointer underline underline-offset-2 hover:text-foreground"
              >
                search manually
              </button>
            </p>
          )}

          {stack.records.length === 0 ? (
            <EmptyStack
              canScan={canScan}
              addedMessage={
                addedCount
                  ? `${plural(addedCount, 'record')} added to your ${LIST_NAMES[list]}.`
                  : null
              }
              onClear={
                stack.notFound.length > 0
                  ? () => updateStack(() => EMPTY_STACK)
                  : undefined
              }
              onClose={onClose}
            />
          ) : (
            <>
              <RecordList className="min-h-0 flex-1 overflow-y-auto">
                {stack.records.map((record) => (
                  <StackRow
                    key={record.barcode}
                    record={record}
                    list={list}
                    addState={addStates[record.barcode]}
                    highlightKey={
                      highlight?.barcode === record.barcode
                        ? highlight.key
                        : undefined
                    }
                    onClick={() => handleRowClick(record)}
                    onRetry={() => void handleConfirm(record.barcode)}
                    isCommitting={isCommitting}
                    onToggleIncluded={() =>
                      updateStack((s) => toggleIncluded(s, record.barcode))
                    }
                  />
                ))}
              </RecordList>

              <StackBar
                list={list}
                summary={summary}
                notes={notes}
                recordCount={stack.records.length}
                isCommitting={isCommitting}
                isPaused={isPaused}
                onConfirm={() => void handleConfirm()}
                onChooseNext={handleChooseNext}
                onSwitchList={() => setList(OTHER_LIST[list])}
                onClear={() => updateStack(() => EMPTY_STACK)}
                onClose={onClose}
              />
            </>
          )}
        </>
      )}

      {opened && (
        <StackRecordScreen
          releaseId={opened.releaseId}
          canChangeRelease={opened.canChangeRelease}
          onRemove={() => updateStack((s) => removeRecord(s, opened.barcode))}
          onChangeRelease={() => setChoosing(opened.barcode)}
          onClose={() => setOpened(null)}
        />
      )}
    </div>
  )
}

// Scan a Stack (CONTEXT.md): sleeves one after another, confirmed at once.
// The Stack outlives the scanner: closing it loses nothing
export const StackScanner = ({
  onClose,
  onSearchManually,
}: StackScannerProps) => {
  const isMobile = useIsMobile()

  if (isMobile) {
    return (
      <Drawer open onOpenChange={onClose}>
        <DrawerContent className="p-6 data-[vaul-drawer-direction=bottom]:max-h-[calc(100dvh-env(safe-area-inset-top)-1rem)]">
          <StackScannerContent
            onClose={onClose}
            onSearchManually={onSearchManually}
          />
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent
        className="flex max-h-[90dvh] flex-col gap-0 overflow-hidden p-6 sm:max-w-md"
        showCloseButton={false}
      >
        <StackScannerContent
          onClose={onClose}
          onSearchManually={onSearchManually}
        />
      </DialogContent>
    </Dialog>
  )
}
