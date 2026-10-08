import { stripDisambiguator } from '#/shared/utils/artist-name'
import { AlertCircle, Check, RotateCcw, X } from 'lucide-react'
import { CollectionIcon } from '#/shared/components/icons/CollectionIcon'
import { ScanIcon } from '#/shared/components/icons/ScanIcon'
import { WantlistIcon } from '#/shared/components/icons/WantlistIcon'

import { useBarcodeScanner } from '#/features/search/hooks/use-barcode-scanner'
import { FulfilledWantPrompt } from '#/features/wantlist/components/FulfilledWantPrompt'
import { CoverArt } from '#/shared/components/CoverArt'
import { releaseCoverKey } from '#/shared/utils/cover-key'
import { GrooveLoader } from '#/shared/components/brand/GrooveLoader'
import { RecordHeading } from '#/shared/components/RecordHeading'
import { Button } from '#/shared/components/ui/button'
import { Dialog, DialogContent } from '#/shared/components/ui/dialog'
import { Input } from '#/shared/components/ui/input'
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
          <AlertCircle className="size-12 text-muted-foreground" />
          <div>
            <p className="type-title text-lg text-foreground">
              Barcode scanning is not supported on this browser.
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Search manually instead.
            </p>
          </div>
          <Button variant="outline" size="lg" onClick={onSearchManually}>
            Search manually →
          </Button>
          {import.meta.env.DEV && (
            <Input
              type="text"
              placeholder="Dev: enter barcode…"
              className="type-catalogue mt-2 h-8 text-center text-xs sm:text-xs"
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
        <ScanIcon className="size-12 text-foreground" />
        <div>
          <p className="type-title text-lg text-foreground">Scan a barcode</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Point your camera at the barcode
            <br />
            on the record sleeve or spine.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <Button size="lg" onClick={startCamera}>
            Start scanning →
          </Button>
          <Button variant="outline" size="lg" onClick={onClose}>
            Cancel
          </Button>
        </div>
        {import.meta.env.DEV && (
          <Input
            type="text"
            placeholder="Dev: enter barcode…"
            className="type-catalogue mt-2 h-8 text-center text-xs sm:text-xs"
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
      <div className="relative aspect-4/3 w-full overflow-hidden rounded-(--radius) bg-vinyl-black">
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
          <Button
            size="lg"
            onClick={handleCancel}
            className="bg-black/40 text-white backdrop-blur"
          >
            Cancel
          </Button>
        </div>
      </div>
    )
  }

  if (scanState === 'not_found') {
    return (
      <div className="flex flex-col items-center gap-5 py-2 text-center">
        <AlertCircle className="size-12 text-muted-foreground" />
        <div>
          <p className="type-title text-lg text-foreground">No result found</p>
          <p className="mt-1 text-sm text-muted-foreground">
            No record matched this barcode on Discogs.
            <br />
            Try searching manually.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <Button variant="outline" size="lg" onClick={handleScanAgain}>
            Scan again
          </Button>
          <Button size="lg" onClick={onSearchManually}>
            Search manually →
          </Button>
        </div>
      </div>
    )
  }

  if (isPending) {
    return (
      <div className="flex items-center justify-center py-12">
        <GrooveLoader size={32} />
      </div>
    )
  }

  const rawTitle = barcodeResult?.title ?? ''
  const dashIndex = rawTitle.indexOf(' - ')
  const artist = stripDisambiguator(
    dashIndex !== -1 ? rawTitle.slice(0, dashIndex) : rawTitle,
  )
  const albumTitle = dashIndex !== -1 ? rawTitle.slice(dashIndex + 3) : rawTitle
  const label = barcodeResult?.labels?.[0]?.name
  const catno = barcodeResult?.catno
  const format = barcodeResult?.formats?.[0]
  const formatParts = [format?.name, ...(format?.descriptions ?? [])].filter(
    Boolean,
  )
  const styles = (barcodeResult?.style ?? []).slice(0, 3)
  const isWanted = barcodeResult?.user_data?.in_wantlist ?? false

  return (
    <div className="relative flex min-h-0 flex-col gap-5 overflow-hidden">
      <div className="relative flex min-h-0 flex-col gap-5 overflow-y-auto">
        {barcodeResult && (
          <CoverArt
            coverKey={releaseCoverKey(
              barcodeResult.id,
              barcodeResult.master_id,
            )}
            artist={artist}
            title={albumTitle}
            styles={[]}
            className="aspect-square w-full shrink-0 overflow-hidden rounded-(--radius)"
          />
        )}

        <div className="flex shrink-0 flex-col items-center gap-3 text-center">
          <RecordHeading
            artist={artist}
            title={albumTitle}
            catalogue={[
              [barcodeResult?.year, ...formatParts].filter(Boolean).join(' · '),
              [label, catno].filter(Boolean).join(' · '),
            ]}
          />
          {styles.length > 0 && (
            <div className="flex flex-wrap justify-center gap-1.5">
              {styles.map((s) => (
                <span
                  key={s}
                  className="rounded-full border border-border px-2.5 py-0.5 text-xs font-medium text-muted-foreground"
                >
                  {s}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="relative flex shrink-0 flex-col gap-2 pt-1">
        {isAskingFulfilledWant && barcodeResult ? (
          <FulfilledWantPrompt
            releaseId={barcodeResult.id}
            onResolved={handleFulfilledWantResolved}
          />
        ) : (
          <>
            <Button
              size="lg"
              onClick={handleAddToCollection}
              disabled={addedToCollection || isCollectionPending}
              className="w-full"
            >
              {addedToCollection ? <Check /> : <CollectionIcon />}
              {addedToCollection ? 'Added to collection' : 'Add to collection'}
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={handleAddToWantlist}
              disabled={addedToWantlist || isWanted || isWantlistPending}
              className="w-full"
            >
              {addedToWantlist || isWanted ? <Check /> : <WantlistIcon />}
              {addedToWantlist
                ? 'Added to wantlist'
                : isWanted
                  ? 'In your wantlist'
                  : 'Add to wantlist'}
            </Button>
          </>
        )}
        <div className="flex gap-2 pt-1">
          <Button variant="ghost" onClick={handleScanAgain} className="flex-1">
            <RotateCcw />
            Scan again
          </Button>
          <Button variant="ghost" onClick={onClose} className="flex-1">
            <X />
            Cancel
          </Button>
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
        <DrawerContent className="p-6 data-[vaul-drawer-direction=bottom]:max-h-[calc(100dvh-env(safe-area-inset-top)-1rem)]">
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
        className="flex max-h-[90dvh] flex-col gap-0 overflow-hidden p-6 sm:max-w-md"
        showCloseButton={false}
      >
        <BarcodeScannerContent
          onClose={onClose}
          onSearchManually={onSearchManually}
        />
      </DialogContent>
    </Dialog>
  )
}
