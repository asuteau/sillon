import { useQuery, useSuspenseQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'

import { collectionValueQueryOptions } from '#/features/collection/collection.queries'
import { profileQueryOptions } from '#/features/profile/profile.queries'
import { DiscogsAttribution } from '#/shared/components/DiscogsAttribution'
import { ThemeToggle } from '#/shared/components/ThemeToggle'
import { buttonVariants } from '#/shared/components/ui/button'
import { discogsCollectionUrl } from '#/shared/utils/discogs-urls'

import { formatEstimatedValue } from '../portrait.utils'

const UNAVAILABLE = '—'

interface PortraitPageProps {
  username: string
}

export const PortraitPage = ({ username }: PortraitPageProps) => {
  const { data: profile } = useSuspenseQuery(profileQueryOptions(username))
  const value = useQuery(collectionValueQueryOptions(username))

  const recordCount = profile?.recordCount ?? 0
  const estimate =
    value.data !== undefined && profile
      ? formatEstimatedValue(value.data, profile.currency)
      : null

  return (
    <PortraitPageView
      username={username}
      isEmpty={!!profile && recordCount === 0}
      recordCount={profile ? recordCount.toLocaleString() : UNAVAILABLE}
      estimatedValue={
        value.isPending ? undefined : (estimate?.median ?? UNAVAILABLE)
      }
      valueRange={estimate?.range}
    />
  )
}

// undefined = still loading
interface PortraitPageViewProps {
  username: string
  isEmpty: boolean
  recordCount: string
  estimatedValue: string | undefined
  valueRange: string | undefined
}

export const PortraitPageView = ({
  username,
  isEmpty,
  recordCount,
  estimatedValue,
  valueRange,
}: PortraitPageViewProps) => {
  if (isEmpty) {
    return (
      <>
        <PortraitTitle />
        <p className="text-muted-foreground">
          Your portrait appears once you add records.{' '}
          <Link to="/search" className="text-foreground underline">
            Search
          </Link>
        </p>
        <PortraitFoot username={username} />
      </>
    )
  }

  return (
    <>
      <PortraitTitle />
      <section aria-label="Your Collection">
        <dl className="m-0 grid grid-cols-2 divide-x divide-border rounded-(--radius) border border-border bg-card py-4">
          <Figure
            label="Estimated value"
            value={estimatedValue}
            hint={valueRange}
          />
          <Figure label="Records" value={recordCount} />
        </dl>
        <DiscogsAttribution href={discogsCollectionUrl(username)} />
      </section>
      <PortraitFoot username={username} />
    </>
  )
}

const PortraitTitle = () => (
  <h1 className="type-display mb-6 text-4xl text-foreground">Portrait</h1>
)

interface FigureProps {
  label: string
  value: string | undefined
  hint?: string
}

const Figure = ({ label, value, hint }: FigureProps) => (
  <div className="flex flex-col items-center gap-1 px-2 text-center">
    <dt className="type-caps text-[11px] text-muted-foreground">{label}</dt>
    <dd className="m-0 flex flex-col items-center gap-0.5">
      {value === undefined ? (
        <span className="h-7 w-16 rounded-(--radius) bg-muted" />
      ) : (
        // Counts are catalogue data; set large here as the headline
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

interface PortraitFootProps {
  username: string
}

// The app's settings: theme and logout live here, not in the header
const PortraitFoot = ({ username }: PortraitFootProps) => (
  <div className="mt-12 flex flex-wrap items-center gap-2 border-t border-border pt-6">
    <ThemeToggle />
    <a
      href="/auth/logout"
      className={buttonVariants({ variant: 'outline', size: 'sm' })}
    >
      {username} · Logout
    </a>
  </div>
)
