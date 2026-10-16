import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'

import { StackScanner } from '#/features/scan/components/StackScanner'
import { useSavedStack } from '#/features/scan/stack.store'
import { CountBadge } from '#/shared/components/CountBadge'
import { ScanIcon } from '#/shared/components/icons/ScanIcon'
import { Button } from '#/shared/components/ui/button'

interface ScanButtonProps {
  username: string
}

export const ScanButton = ({ username }: ScanButtonProps) => {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  // A Stack waiting to be confirmed shows on the button, not to be forgotten
  const stack = useSavedStack(username)

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
        aria-label={
          stack.records.length > 0
            ? `Scan a barcode, ${stack.records.length} in your stack`
            : 'Scan a barcode'
        }
      >
        <ScanIcon />
        <span className="hidden sm:inline">Scan</span>
        <CountBadge count={stack.records.length} />
      </Button>

      {open && (
        <StackScanner
          onClose={() => setOpen(false)}
          onSearchManually={handleSearchManually}
        />
      )}
    </>
  )
}
