// Barcodes printed on record sleeves
const SLEEVE_FORMATS = ['ean_13', 'ean_8', 'upc_a', 'upc_e'] as const

export interface BarcodeReader {
  detect: (source: HTMLVideoElement) => Promise<{ rawValue: string }[]>
}

interface NativeBarcodeDetector {
  new (options: { formats: string[] }): BarcodeReader
}

declare global {
  interface Window {
    BarcodeDetector?: NativeBarcodeDetector
  }
}

/** Barcodes can be read wherever there is a camera to read them from
 * (no camera API outside secure contexts) */
export const canScanBarcodes = () =>
  typeof navigator !== 'undefined' && 'mediaDevices' in navigator

/** The browser's own barcode reader (Chrome on Android, macOS), else the
 * ZXing WebAssembly one (iOS Safari, Firefox). The WASM is only downloaded
 * where it's needed, and from Sillon itself, never a CDN */
export const createBarcodeReader = async (): Promise<BarcodeReader> => {
  if (window.BarcodeDetector) {
    return new window.BarcodeDetector({ formats: [...SLEEVE_FORMATS] })
  }

  const [{ BarcodeDetector, prepareZXingModule }, { default: wasmUrl }] =
    await Promise.all([
      import('barcode-detector/ponyfill'),
      import('zxing-wasm/reader/zxing_reader.wasm?url'),
    ])
  prepareZXingModule({
    overrides: {
      locateFile: (path: string, prefix: string) =>
        path.endsWith('.wasm') ? wasmUrl : prefix + path,
    },
  })
  return new BarcodeDetector({ formats: [...SLEEVE_FORMATS] })
}
