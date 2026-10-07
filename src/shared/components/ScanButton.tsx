import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'

import { BarcodeScanner } from '#/shared/components/BarcodeScanner'
import { ScanIcon } from '#/shared/components/icons/ScanIcon'
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
        <ScanIcon />
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
