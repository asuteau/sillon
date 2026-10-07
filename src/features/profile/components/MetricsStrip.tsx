import { useQuery } from '@tanstack/react-query'

import { collectionValueQueryOptions } from '#/features/collection/collection.queries'
import { formatAmount } from '#/features/collection/collection.utils'

import { cn } from '#/shared/utils/cn'

import { profileQueryOptions } from '../profile.queries'

const UNAVAILABLE = '—'

interface MetricsStripProps {
  username: string
}

export function MetricsStrip({ username }: MetricsStripProps) {
  const profile = useQuery(profileQueryOptions(username))
  const value = useQuery(collectionValueQueryOptions(username))

  const currency = profile.data?.currency
  const isValueLoading = value.isPending || (!!value.data && profile.isPending)
  const estimate =
    value.data && currency
      ? {
          median: `≈ ${formatAmount(value.data.median, currency)}`,
          range: `${formatAmount(value.data.minimum, currency)} – ${formatAmount(value.data.maximum, currency)}`,
        }
      : null

  return (
    <MetricsStripView
      recordCount={formatCount(profile.isPending, profile.data?.recordCount)}
      wantlistCount={formatCount(
        profile.isPending,
        profile.data?.wantlistCount,
      )}
      estimatedValue={
        isValueLoading ? undefined : (estimate?.median ?? UNAVAILABLE)
      }
      valueRange={estimate?.range}
    />
  )
}

function formatCount(isPending: boolean, count: number | undefined) {
  if (isPending) return undefined
  if (count === undefined) return UNAVAILABLE
  return count.toLocaleString()
}

// undefined = still loading
interface MetricsStripViewProps {
  recordCount: string | undefined
  estimatedValue: string | undefined
  valueRange: string | undefined
  wantlistCount: string | undefined
}

export function MetricsStripView({
  recordCount,
  estimatedValue,
  valueRange,
  wantlistCount,
}: MetricsStripViewProps) {
  return (
    <dl className="mb-6 rounded-(--radius) border border-border bg-card">
      <Metric
        label="Estimated value"
        value={estimatedValue}
        hint={valueRange}
        className="border-b border-border py-4"
      />
      <div className="grid grid-cols-2 divide-x divide-border py-4">
        <Metric label="Records" value={recordCount} />
        <Metric label="Wanted" value={wantlistCount} />
      </div>
    </dl>
  )
}

interface MetricProps {
  label: string
  value: string | undefined
  hint?: string
  className?: string
}

function Metric({ label, value, hint, className }: MetricProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center gap-1 px-2 text-center',
        className,
      )}
    >
      <dt className="type-caps text-[11px] text-muted-foreground">{label}</dt>
      <dd className="m-0 flex flex-col items-center gap-0.5">
        {value === undefined ? (
          <span className="h-7 w-16 rounded-(--radius) bg-muted" />
        ) : (
          // Counts are catalogue data; set large here as the strip's headline
          <span className="type-catalogue text-2xl leading-7 font-medium text-foreground">
            {value}
          </span>
        )}
        {hint && (
          <span className="type-catalogue text-[10px] text-muted-foreground">
            {hint}
          </span>
        )}
      </dd>
    </div>
  )
}
