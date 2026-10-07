import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { ScanLine } from 'lucide-react'

import { BarcodeScanner } from '#/shared/components/BarcodeScanner'
import { Button } from '#/shared/components/ui/button'

export const ScanButton = () => {
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
        size="sm"
        onClick={() => setOpen(true)}
        aria-label="Scan a barcode"
      >
        <ScanLine />
        <span className="hidden sm:inline">Scan</span>
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
