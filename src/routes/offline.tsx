import { createFileRoute } from '@tanstack/react-router'
import { WifiOff } from 'lucide-react'

export const Route = createFileRoute('/offline')({
  component: OfflinePage,
})

function OfflinePage() {
  const handleRetry = () => window.location.reload()

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 p-8 text-center">
      <WifiOff size={48} className="text-muted-foreground" />
      <h1 className="text-xl font-semibold">You're offline</h1>
      <p className="max-w-xs text-sm text-muted-foreground">
        Your collection is available if it was loaded during your last session.
      </p>
      <button
        type="button"
        onClick={handleRetry}
        className="mt-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
      >
        ↺ Try again
      </button>
    </div>
  )
}
