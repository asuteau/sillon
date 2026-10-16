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
  choosePressing,
  chosenPressing,
  EMPTY_STACK,
  isInList,
  stackSummary,
  toggleIncluded,
} from '../stack.model'
import type { StackList, StackRecord } from '../stack.model'
import { updateStack, useStack } from '../stack.store'
import { PressingChooser } from './PressingChooser'
import { StackRow } from './StackRow'
import { Viewfinder } from './Viewfinder'

const LIST_NAMES: Record<StackList, string> = {
  collection: 'Collection',
  wantlist: 'Wantlist',
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
const CameraPanel = ({
  cameraState,
  onSearchManually,
  children,
}: CameraPanelProps) => {
  if (cameraState === 'unsupported' || cameraState === 'blocked') {
    const isBlocked = cameraState === 'blocked'
    return (
      <div className="flex shrink-0 flex-col items-center gap-4 py-2 text-center">
        {isBlocked ? (
          <ScanIcon className="size-10 text-muted-foreground" />
        ) : (
          <AlertCircle className="size-10 text-muted-foreground" />
        )}
        <div>
          <p className="type-title text-lg text-foreground">
            {isBlocked ? 'Camera access blocked' : 'No camera on this browser'}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {isBlocked
              ? 'Allow the camera for Sillon in your browser settings, or search manually.'
              : 'Search manually instead.'}
          </p>
        </div>
        <Button variant="outline" onClick={onSearchManually}>
          Search manually →
        </Button>
      </div>
    )
  }

  return children
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
  const [isConfirmingClear, setIsConfirmingClear] = useState(false)
  const [addedCount, setAddedCount] = useState<number | null>(null)
  // The Unresolved record whose pressing is being chosen
  const [choosing, setChoosing] = useState<string | null>(null)
  const choosingRecord = stack.records.find(
    (r) => r.barcode === choosing && r.status === 'found',
  )

  const summary = stackSummary(stack, list)
  const otherList: StackList = list === 'collection' ? 'wantlist' : 'collection'

  const handleRowClick = (record: StackRecord) => {
    if (record.status !== 'found') return
    const pressing = chosenPressing(record)
    if (!pressing) return setChoosing(record.barcode)
    if (isInList(pressing, list)) {
      updateStack((s) => toggleIncluded(s, record.barcode))
    }
  }

  const handleChoose = (releaseId: number) => {
    if (choosing) updateStack((s) => choosePressing(s, choosing, releaseId))
    setChoosing(null)
  }

  const handleConfirm = async () => {
    try {
      const added = await commit(list)
      setAddedCount(added.length)
    } catch {
      // Rows that failed stay on the Stack, marked
    }
  }

  const notes = [
    summary.alreadyIn > 0 &&
      `${summary.alreadyIn} already in ${LIST_NAMES[list]}`,
    summary.unresolved > 0 && `${summary.unresolved} to choose`,
    failedCount > 0 &&
      !isCommitting &&
      `${plural(failedCount, 'record')} couldn't be added — try again`,
  ].filter(Boolean)

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

      {choosingRecord?.status === 'found' ? (
        <PressingChooser
          pressings={choosingRecord.pressings}
          chosenId={choosingRecord.chosenId}
          onChoose={handleChoose}
          onBack={() => setChoosing(null)}
        />
      ) : (
        <>
          {stack.records.length > 0 ? (
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
                />
              ))}
            </RecordList>
          ) : (
            <p className="shrink-0 py-2 text-center text-sm text-muted-foreground">
              {addedCount
                ? `${plural(addedCount, 'record')} added to your ${LIST_NAMES[list]}.`
                : 'Scan sleeves one after another: they pile up here.'}
            </p>
          )}

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

          <div className="flex shrink-0 flex-col gap-2">
            {notes.length > 0 && (
              <p className="text-center text-xs text-muted-foreground">
                {notes.join(' · ')}
              </p>
            )}
            <Button
              size="lg"
              className="w-full"
              disabled={summary.toAdd === 0 || isCommitting}
              onClick={() => void handleConfirm()}
            >
              {list === 'collection' ? <CollectionIcon /> : <WantlistIcon />}
              {isPaused
                ? 'Pausing for Discogs…'
                : isCommitting
                  ? `Adding to ${LIST_NAMES[list]}…`
                  : `Add ${summary.toAdd} to ${LIST_NAMES[list]}`}
            </Button>

            {isConfirmingClear ? (
              <div className="flex items-center gap-2">
                <span className="flex-1 text-sm text-muted-foreground">
                  Clear {plural(stack.records.length, 'record')}?
                </span>
                <Button
                  variant="outline"
                  onClick={() => setIsConfirmingClear(false)}
                >
                  Keep
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    updateStack(() => EMPTY_STACK)
                    setIsConfirmingClear(false)
                  }}
                >
                  Clear
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  className="flex-1"
                  disabled={isCommitting}
                  onClick={() => setList(otherList)}
                >
                  To {LIST_NAMES[otherList]} instead
                </Button>
                {stack.records.length + stack.notFound.length > 0 && (
                  <Button
                    variant="ghost"
                    disabled={isCommitting}
                    onClick={() => setIsConfirmingClear(true)}
                  >
                    Clear stack
                  </Button>
                )}
                <Button variant="ghost" onClick={onClose} aria-label="Close">
                  <X />
                </Button>
              </div>
            )}
          </div>
        </>
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
