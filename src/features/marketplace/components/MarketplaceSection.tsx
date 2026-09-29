import { useQuery } from '@tanstack/react-query'
import { ExternalLink, RotateCw } from 'lucide-react'

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
      isLoading={stats.isPending}
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
        <span className="h-4 w-44 animate-pulse rounded-md bg-(--line)" />
        <span className="h-4 w-32 animate-pulse rounded-md bg-(--line)" />
      </MarketplaceShell>
    )
  }

  if (isError || !stats) {
    return (
      <MarketplaceShell>
        <button
          type="button"
          onClick={onRetry}
          className="flex items-center gap-1.5 text-sm text-(--sea-ink-soft) hover:text-(--sea-ink)"
        >
          Marketplace unavailable
          <RotateCw className="h-3.5 w-3.5" aria-label="Retry" />
        </button>
      </MarketplaceShell>
    )
  }

  if (stats.status === 'blocked') {
    return (
      <MarketplaceShell>
        <p className="text-sm text-(--sea-ink-soft)">
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
          <span className="mr-0.5 text-xs text-(--sea-ink-soft)">
            Suggested
          </span>
          {suggestedPrices.map(({ condition, price }) => (
            <span
              key={condition}
              className="rounded-full border border-(--line) px-2 py-0.5 font-mono text-xs text-(--sea-ink)"
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
        className="flex items-center gap-1 text-sm font-medium text-(--lagoon-deep) hover:underline"
      >
        See Listings on Discogs
        <ExternalLink className="h-3.5 w-3.5" aria-hidden />
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
    return <p className="text-sm text-(--sea-ink-soft)">No Listings</p>
  }

  return (
    <p className="text-sm text-(--sea-ink)">
      <span className="font-semibold tabular-nums">{listingCount}</span> for
      sale
      {lowestPrice && (
        <>
          {' · from '}
          <span className="font-semibold tabular-nums">{lowestPrice}</span>
          <span className="text-xs text-(--sea-ink-soft)">
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
    className="flex flex-col items-center gap-2 border-t border-(--line) pt-4 text-center"
  >
    <h3 className="island-kicker">Marketplace</h3>
    {children}
  </section>
)
