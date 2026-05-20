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
    <div className="flex items-center justify-between gap-2 bg-[#8B7FE8] px-4 py-2 text-sm text-white">
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
        className="shrink-0 rounded p-0.5 hover:bg-white/20"
      >
        <X size={14} />
      </button>
    </div>
  )
}
