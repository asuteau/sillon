import {
  AlertCircle,
  Check,
  Heart,
  Library,
  RotateCcw,
  ScanLine,
  X,
} from 'lucide-react'

import { useBarcodeScanner } from '#/features/search/hooks/use-barcode-scanner'
import { FulfilledWantPrompt } from '#/features/wantlist/components/FulfilledWantPrompt'
import { CoverArt } from '#/shared/components/CoverArt'
import { releaseCoverKey } from '#/shared/utils/cover-key'
import { Dialog, DialogContent } from '#/shared/components/ui/dialog'
import { Drawer, DrawerContent } from '#/shared/components/ui/drawer'
import { useIsMobile } from '#/shared/hooks/use-is-mobile'

interface BarcodeScannerProps {
  onClose: () => void
  onSearchManually?: () => void
}

const BarcodeScannerContent = ({
  onClose,
  onSearchManually,
}: BarcodeScannerProps) => {
  const {
    scanState,
    isSupported,
    barcodeResult,
    isPending,
    videoRef,
    addedToCollection,
    addedToWantlist,
    isAskingFulfilledWant,
    isCollectionPending,
    isWantlistPending,
    startCamera,
    handleCancel,
    handleScanAgain,
    handleAddToCollection,
    handleAddToWantlist,
    handleFulfilledWantResolved,
    handleManualBarcode,
  } = useBarcodeScanner(onClose)

  if (scanState === 'idle') {
    if (!isSupported) {
      return (
        <div className="flex flex-col items-center gap-5 py-2 text-center">
          <AlertCircle className="h-12 w-12 text-(--sea-ink-soft)" />
          <div>
            <p className="font-semibold text-(--sea-ink)">
              Barcode scanning is not supported on this browser.
            </p>
            <p className="mt-1 text-sm text-(--sea-ink-soft)">
              Please search manually.
            </p>
          </div>
          <button
            onClick={onSearchManually}
            className="flex items-center gap-1.5 rounded-full border border-(--chip-line) bg-(--chip-bg) px-4 py-2 text-sm font-semibold text-(--sea-ink) cursor-pointer"
          >
            Search manually →
          </button>
          {import.meta.env.DEV && (
            <input
              type="text"
              placeholder="Dev: enter barcode…"
              className="mt-2 w-full rounded-lg border border-(--chip-line) bg-(--chip-bg) px-3 py-1.5 text-center font-mono text-xs text-(--sea-ink) placeholder:text-(--sea-ink-soft) outline-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter')
                  handleManualBarcode(e.currentTarget.value)
              }}
            />
          )}
        </div>
      )
    }

    return (
      <div className="flex flex-col items-center gap-5 py-2 text-center">
        <ScanLine className="h-12 w-12 text-(--sea-ink)" />
        <div>
          <p className="font-semibold text-(--sea-ink)">Scan a barcode</p>
          <p className="mt-1 text-sm text-(--sea-ink-soft)">
            Point your camera at the barcode
            <br />
            on the record sleeve or spine.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <button
            onClick={startCamera}
            className="flex items-center gap-1.5 rounded-full bg-(--sea-ink) px-4 py-2 text-sm font-semibold text-(--chip-bg) cursor-pointer"
          >
            Start scanning →
          </button>
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 rounded-full border border-(--chip-line) bg-(--chip-bg) px-4 py-2 text-sm font-semibold text-(--sea-ink) cursor-pointer"
          >
            Cancel
          </button>
        </div>
        {import.meta.env.DEV && (
          <input
            type="text"
            placeholder="Dev: enter barcode…"
            className="mt-2 w-full rounded-lg border border-(--chip-line) bg-(--chip-bg) px-3 py-1.5 text-center font-mono text-xs text-(--sea-ink) placeholder:text-(--sea-ink-soft) outline-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleManualBarcode(e.currentTarget.value)
            }}
          />
        )}
      </div>
    )
  }

  if (scanState === 'scanning') {
    return (
      <div className="relative aspect-4/3 w-full overflow-hidden rounded-2xl">
        <video
          ref={videoRef}
          playsInline
          muted
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
          <div className="relative h-28 w-64">
            <span className="absolute top-0 left-0 h-6 w-6 border-t-2 border-l-2 border-white" />
            <span className="absolute top-0 right-0 h-6 w-6 border-t-2 border-r-2 border-white" />
            <span className="absolute bottom-0 left-0 h-6 w-6 border-b-2 border-l-2 border-white" />
            <span className="absolute bottom-0 right-0 h-6 w-6 border-b-2 border-r-2 border-white" />
          </div>
          <p className="text-sm font-semibold text-white drop-shadow">
            Point at barcode
          </p>
        </div>
        <div className="absolute bottom-6 inset-x-0 flex justify-center">
          <button
            onClick={handleCancel}
            className="flex items-center gap-1.5 rounded-full bg-black/40 px-4 py-2 text-sm font-semibold text-white backdrop-blur cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  if (scanState === 'not_found') {
    return (
      <div className="flex flex-col items-center gap-5 py-2 text-center">
        <AlertCircle className="h-12 w-12 text-(--sea-ink-soft)" />
        <div>
          <p className="font-semibold text-(--sea-ink)">No result found</p>
          <p className="mt-1 text-sm text-(--sea-ink-soft)">
            No record matched this barcode on Discogs.
            <br />
            Try searching manually.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <button
            onClick={handleScanAgain}
            className="flex items-center gap-1.5 rounded-full border border-(--chip-line) bg-(--chip-bg) px-4 py-2 text-sm font-semibold text-(--sea-ink) cursor-pointer"
          >
            Scan again
          </button>
          <button
            onClick={onSearchManually}
            className="flex items-center gap-1.5 rounded-full bg-(--sea-ink) px-4 py-2 text-sm font-semibold text-(--chip-bg) cursor-pointer"
          >
            Search manually →
          </button>
        </div>
      </div>
    )
  }

  if (isPending) {
    return (
      <div className="flex items-center justify-center py-12">
        <ScanLine className="h-8 w-8 animate-pulse text-(--sea-ink-soft)" />
      </div>
    )
  }

  const rawTitle = barcodeResult?.title ?? ''
  const dashIndex = rawTitle.indexOf(' - ')
  const artist = dashIndex !== -1 ? rawTitle.slice(0, dashIndex) : rawTitle
  const albumTitle = dashIndex !== -1 ? rawTitle.slice(dashIndex + 3) : rawTitle
  const thumb = barcodeResult?.thumb ?? barcodeResult?.cover_image ?? null
  const label = barcodeResult?.labels?.[0]?.name
  const catno = barcodeResult?.catno
  const format = barcodeResult?.formats?.[0]
  const formatParts = [format?.name, ...(format?.descriptions ?? [])].filter(
    Boolean,
  )
  const styles = (barcodeResult?.style ?? []).slice(0, 3)

  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute -bottom-16 -right-16 h-40 w-40 rounded-full bg-[radial-gradient(circle,rgba(47,106,74,0.18),transparent_66%)]" />
      <div className="relative flex flex-col gap-5">
        {barcodeResult && (
          <CoverArt
            coverKey={releaseCoverKey(
              barcodeResult.id,
              barcodeResult.master_id,
            )}
            artist={artist}
            title={albumTitle}
            thumb={thumb}
            styles={[]}
            className="aspect-square w-full overflow-hidden rounded-2xl"
          />
        )}

        <div className="flex flex-col gap-2 items-center text-center">
          <p className="island-kicker">{artist}</p>
          <h2 className="display-title text-2xl font-bold tracking-tight text-(--sea-ink)">
            {albumTitle}
          </h2>
          {(barcodeResult?.year || formatParts.length > 0) && (
            <p className="font-mono text-sm text-(--sea-ink-soft)">
              {[barcodeResult?.year, ...formatParts]
                .filter(Boolean)
                .join(' · ')}
            </p>
          )}
          {(label || catno) && (
            <p className="text-sm text-(--sea-ink-soft)">
              {[label, catno].filter(Boolean).join(' · ')}
            </p>
          )}
          {styles.length > 0 && (
            <div className="flex flex-wrap justify-center gap-1.5">
              {styles.map((s) => (
                <span
                  key={s}
                  className="rounded-full border border-(--chip-line) bg-(--chip-bg) px-2.5 py-0.5 text-xs font-medium text-(--sea-ink-soft)"
                >
                  {s}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 pt-1">
          {isAskingFulfilledWant && barcodeResult ? (
            <FulfilledWantPrompt
              releaseId={barcodeResult.id}
              onResolved={handleFulfilledWantResolved}
            />
          ) : (
            <>
              <button
                onClick={handleAddToCollection}
                disabled={addedToCollection || isCollectionPending}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-(--sea-ink) px-4 py-2.5 text-sm font-semibold text-(--chip-bg) disabled:opacity-50 cursor-pointer"
              >
                {addedToCollection ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <Library className="h-3.5 w-3.5" />
                )}
                {addedToCollection
                  ? 'Added to collection!'
                  : 'Add to collection'}
              </button>
              <button
                onClick={handleAddToWantlist}
                disabled={addedToWantlist || isWantlistPending}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-(--sea-ink) px-4 py-2.5 text-sm font-semibold text-(--chip-bg) disabled:opacity-50 cursor-pointer"
              >
                {addedToWantlist ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <Heart className="h-3.5 w-3.5" />
                )}
                {addedToWantlist ? 'Added to wantlist!' : 'Add to wantlist'}
              </button>
            </>
          )}
          <div className="flex gap-2 pt-1">
            <button
              onClick={handleScanAgain}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-(--chip-line) bg-(--chip-bg) px-4 py-2 text-sm font-semibold text-(--sea-ink) cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Scan again
            </button>
            <button
              onClick={onClose}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-(--chip-line) bg-(--chip-bg) px-4 py-2 text-sm font-semibold text-(--sea-ink) cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export const BarcodeScanner = ({
  onClose,
  onSearchManually,
}: BarcodeScannerProps) => {
  const isMobile = useIsMobile()

  if (isMobile) {
    return (
      <Drawer open onOpenChange={onClose}>
        <DrawerContent className="island-shell overflow-y-auto p-6">
          <BarcodeScannerContent
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
        className="max-w-md rounded-none border-0 bg-transparent p-0 ring-0 shadow-none"
        showCloseButton={false}
      >
        <div className="island-shell overflow-hidden rounded-3xl p-6">
          <BarcodeScannerContent
            onClose={onClose}
            onSearchManually={onSearchManually}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
