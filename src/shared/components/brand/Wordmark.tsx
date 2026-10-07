import { cn } from '#/shared/utils/cn'

interface WordmarkProps {
  className?: string
}

export const Wordmark = ({ className }: WordmarkProps) => (
  <span
    className={cn(
      'font-display leading-none font-bold tracking-[-0.055em] lowercase',
      className,
    )}
  >
    sillon
  </span>
)
