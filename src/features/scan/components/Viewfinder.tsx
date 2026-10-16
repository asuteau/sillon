import type { CameraState } from '../hooks/use-scan-camera'
import type { ScanFlash } from '../hooks/use-stack-scanner'

const CORNER = 'absolute size-6 border-white'

interface ViewfinderProps {
  cameraState: CameraState
  videoRef: React.Ref<HTMLVideoElement>
  flash: ScanFlash | null
}

// The live camera, kept on while sleeves go by: each hit flashes, a barcode
// Discogs doesn't know says so, so that sleeve can be set aside
export const Viewfinder = ({
  cameraState,
  videoRef,
  flash,
}: ViewfinderProps) => (
  <div className="relative aspect-4/3 max-h-[40svh] w-full shrink-0 overflow-hidden rounded-(--radius) bg-vinyl-black">
    <video
      ref={videoRef}
      playsInline
      muted
      className={`h-full w-full object-cover transition-opacity duration-160 ease-fade ${cameraState === 'live' ? 'opacity-100' : 'opacity-0'}`}
    />
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
      <div className="relative h-24 w-56 max-w-[80%]">
        <span className={`${CORNER} top-0 left-0 border-t-2 border-l-2`} />
        <span className={`${CORNER} top-0 right-0 border-t-2 border-r-2`} />
        <span className={`${CORNER} bottom-0 left-0 border-b-2 border-l-2`} />
        <span className={`${CORNER} right-0 bottom-0 border-b-2 border-r-2`} />
      </div>
      <p className="text-sm font-semibold text-white drop-shadow">
        {cameraState === 'live' ? 'Point at barcode' : 'Starting camera…'}
      </p>
    </div>
    {flash?.kind === 'hit' && (
      <div
        key={flash.key}
        aria-hidden
        className="scan-flash pointer-events-none absolute inset-0 bg-white"
      />
    )}
    {flash?.kind === 'not-found' && (
      <div
        key={flash.key}
        role="status"
        className="scan-notice pointer-events-none absolute inset-0 flex items-center justify-center bg-vinyl-black/80"
      >
        <p className="type-title text-lg text-white">Not on Discogs</p>
      </div>
    )}
  </div>
)
