import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { ScanLine } from 'lucide-react'

import { BarcodeScanner } from '#/shared/components/BarcodeScanner'

export const ScanButton = () => {
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
        className="flex items-center gap-1.5 rounded-full border border-(--chip-line) bg-(--chip-bg) px-3 py-1.5 text-sm font-semibold text-(--sea-ink) transition hover:bg-(--lagoon)/10 cursor-pointer"
      >
        <ScanLine className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Scan</span>
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
