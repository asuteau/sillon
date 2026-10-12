import { X } from 'lucide-react'
import { useState } from 'react'
import { usePwaUpdate } from '#/shared/hooks/use-pwa-update'

export const PwaUpdateBanner = () => {
  const { needRefresh, updateServiceWorker } = usePwaUpdate()
  const [dismissed, setDismissed] = useState(false)

  if (!needRefresh || dismissed) return null

  const handleUpdate = async () => {
    try {
      await updateServiceWorker(true)
    } catch {
      window.location.reload()
    }
  }

  const handleDismiss = () => setDismissed(true)

  return (
    // Solid --primary like the default button: neutral, inverted per theme
    <div className="flex items-center justify-between gap-2 bg-primary px-4 py-2 text-sm text-primary-foreground">
      <button
        type="button"
        onClick={handleUpdate}
        className="flex-1 text-left font-medium"
      >
        ↑ New version available — tap to update
      </button>
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Dismiss"
        className="shrink-0 rounded-full p-1 hover:bg-primary-foreground/15"
      >
        <X size={14} />
      </button>
    </div>
  )
}
