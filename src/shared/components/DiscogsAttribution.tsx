import { cn } from '#/shared/utils/cn'

interface DiscogsAttributionProps {
  /** The discogs.com page holding the data shown above */
  href: string
  className?: string
}

// Required by the Discogs API terms at the foot of each block of Discogs data.
// A followed link: no nofollow, so the page gets its search ranking credit.
export const DiscogsAttribution = ({
  href,
  className,
}: DiscogsAttributionProps) => (
  <p
    className={cn(
      'type-catalogue m-0 mt-3 text-[11px] text-muted-foreground',
      className,
    )}
  >
    <a
      href={href}
      target="_blank"
      rel="noopener"
      className="text-muted-foreground no-underline hover:text-foreground hover:underline"
    >
      Data provided by Discogs
    </a>
  </p>
)
