import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { ScanLine } from 'lucide-react'

import { BarcodeScanner } from '#/shared/components/BarcodeScanner'
import { Button } from '#/shared/components/ui/button'

export const ScanFab = () => {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  const handleSearchManually = () => {
    setOpen(false)
    navigate({ to: '/search' }).catch(() => {})
  }

  return (
    <>
      <Button
        variant="lacquer"
        size="lg"
        onClick={() => setOpen(true)}
        aria-label="Scan a barcode"
        className="fixed right-4 bottom-20 z-50 h-12 gap-2 px-5 sm:hidden"
      >
        <ScanLine />
        Scan
      </Button>

      {open && (
        <BarcodeScanner
          onClose={() => setOpen(false)}
          onSearchManually={handleSearchManually}
        />
      )}
    </>
  )
}
