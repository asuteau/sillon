import { Button } from '#/shared/components/ui/button'
import { cn } from '#/shared/utils/cn'

interface ReadFailedProps {
  onRetry: () => void
  className?: string
}

// A full read that stopped on a failed page: retrying continues from there
export const ReadFailed = ({ onRetry, className }: ReadFailedProps) => (
  <p
    role="alert"
    className={cn(
      'type-catalogue flex flex-wrap items-center gap-3 text-sm text-muted-foreground',
      className,
    )}
  >
    Couldn't reach Discogs.
    <Button variant="outline" size="sm" onClick={onRetry}>
      Try again
    </Button>
  </p>
)
