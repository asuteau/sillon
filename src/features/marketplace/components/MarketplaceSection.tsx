import { useQuery } from '@tanstack/react-query'
import { ExternalLink, RotateCw } from 'lucide-react'

import { Button } from '#/shared/components/ui/button'

import type { MarketplaceStats, SuggestedPrice } from '../marketplace.model'
import {
  marketplaceStatsQueryOptions,
  suggestedPricesQueryOptions,
} from '../marketplace.queries'
import { discogsListingsUrl, formatPrice } from '../marketplace.utils'

interface MarketplaceSectionProps {
  releaseId: number
}

export const MarketplaceSection = ({ releaseId }: MarketplaceSectionProps) => {
  const stats = useQuery(marketplaceStatsQueryOptions(releaseId))
  const suggestions = useQuery(suggestedPricesQueryOptions(releaseId))

  return (
    <MarketplaceSectionView
      releaseId={releaseId}
      stats={stats.data}
      isLoading={stats.isPending || suggestions.isPending}
      isError={stats.isError || stats.data === null}
      onRetry={() => void stats.refetch()}
      suggestedPrices={suggestions.data ?? []}
    />
  )
}

interface MarketplaceSectionViewProps {
  releaseId: number
  stats: MarketplaceStats | null | undefined
  isLoading: boolean
  isError: boolean
  onRetry: () => void
  suggestedPrices: SuggestedPrice[]
}

export const MarketplaceSectionView = ({
  releaseId,
  stats,
  isLoading,
  isError,
  onRetry,
  suggestedPrices,
}: MarketplaceSectionViewProps) => {
  if (isLoading) {
    return (
      <MarketplaceShell>
        <span className="h-5 w-52 rounded-(--radius) bg-muted" />
        <span className="h-5.5 w-60 rounded-full bg-muted" />
        <span className="h-5 w-40 rounded-(--radius) bg-muted" />
      </MarketplaceShell>
    )
  }

  if (isError || !stats) {
    return (
      <MarketplaceShell>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRetry}
          className="text-muted-foreground hover:text-foreground"
        >
          Marketplace unavailable
          <RotateCw aria-label="Retry" />
        </Button>
      </MarketplaceShell>
    )
  }

  if (stats.status === 'blocked') {
    return (
      <MarketplaceShell>
        <p className="text-sm text-muted-foreground">
          Can&apos;t be sold on Discogs
        </p>
      </MarketplaceShell>
    )
  }

  return (
    <MarketplaceShell>
      <ListingsSummary
        listingCount={stats.listingCount}
        lowestPrice={
          stats.lowestPrice ? formatPrice(stats.lowestPrice) : undefined
        }
      />

      {suggestedPrices.length > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-1.5">
          <span className="mr-0.5 text-xs text-muted-foreground">
            Suggested
          </span>
          {suggestedPrices.map(({ condition, price }) => (
            <span
              key={condition}
              className="type-catalogue rounded-full border border-border px-2 py-0.5 text-[11px] text-foreground"
            >
              {condition} {formatPrice(price)}
            </span>
          ))}
        </div>
      )}

      <a
        href={discogsListingsUrl(releaseId)}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1 text-sm font-semibold text-foreground underline-offset-4 hover:underline"
      >
        See Listings on Discogs
        <ExternalLink className="size-3.5" aria-hidden />
      </a>
    </MarketplaceShell>
  )
}

interface ListingsSummaryProps {
  listingCount: number
  lowestPrice: string | undefined
}

const ListingsSummary = ({
  listingCount,
  lowestPrice,
}: ListingsSummaryProps) => {
  if (listingCount === 0) {
    return <p className="text-sm text-muted-foreground">No Listings</p>
  }

  return (
    <p className="text-sm text-foreground">
      <span className="type-catalogue font-semibold">{listingCount}</span> for
      sale
      {lowestPrice && (
        <>
          {' · from '}
          <span className="type-catalogue font-semibold">{lowestPrice}</span>
          <span className="text-xs text-muted-foreground">
            {' '}
            (excl. shipping)
          </span>
        </>
      )}
    </p>
  )
}

interface MarketplaceShellProps {
  children: React.ReactNode
}

const MarketplaceShell = ({ children }: MarketplaceShellProps) => (
  <section
    aria-label="Marketplace"
    className="flex flex-col items-center gap-2 border-t border-border pt-4 text-center"
  >
    <h3 className="type-caps text-[11px] text-muted-foreground">Marketplace</h3>
    {/* Fixed min height (summary + suggested prices + link) so the sheet
        cover doesn't resize when the state changes. */}
    <div className="flex min-h-19.5 flex-col items-center justify-center gap-2">
      {children}
    </div>
  </section>
)
