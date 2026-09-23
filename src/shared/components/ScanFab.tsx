import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { ScanLine } from 'lucide-react'

import { BarcodeScanner } from '#/shared/components/BarcodeScanner'

export const ScanFab = () => {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  const handleSearchManually = () => {
    setOpen(false)
    navigate({ to: '/search' }).catch(() => {})
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Scan a barcode"
        className="fixed bottom-20 right-4 z-50 flex items-center gap-2 rounded-full bg-(--sea-ink)/90 px-5 py-3 text-sm font-semibold text-(--chip-bg) shadow-[0_8px_24px_rgba(30,90,72,0.12)] backdrop-blur-lg sm:hidden cursor-pointer"
      >
        <ScanLine className="h-4 w-4" />
        Scan
      </button>

      {open && (
        <BarcodeScanner
          onClose={() => setOpen(false)}
          onSearchManually={handleSearchManually}
        />
      )}
    </>
  )
}
