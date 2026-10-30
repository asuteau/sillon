import { useQuery, useSuspenseQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'

import { collectionValueQueryOptions } from '#/features/collection/collection.queries'
import { profileQueryOptions } from '#/features/profile/profile.queries'
import { DiscogsAttribution } from '#/shared/components/DiscogsAttribution'
import { ReadingState } from '#/shared/components/ReadingState'
import { Button, buttonVariants } from '#/shared/components/ui/button'
import { discogsCollectionUrl } from '#/shared/utils/discogs-urls'

import { useCollectionScan } from '../hooks/use-collection-scan'
import type { CollectionScan } from '../hooks/use-collection-scan'
import { formatEstimatedValue, formatRecords } from '../portrait.utils'
import { PortraitFigures } from './PortraitFigures'
import { PortraitHeldSections } from './PortraitHeldSections'
import { RankedList } from './RankedList'
import { TimeChart } from './TimeChart'

const UNAVAILABLE = '—'

interface PortraitPageProps {
  username: string
}

export const PortraitPage = ({ username }: PortraitPageProps) => {
  const { data: profile } = useSuspenseQuery(profileQueryOptions(username))
  const value = useQuery(collectionValueQueryOptions(username))

  const recordCount = profile?.recordCount ?? 0
  const { scan, retry } = useCollectionScan(recordCount > 0)
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
      scan={scan}
      onRetryScan={retry}
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
  scan: CollectionScan
  onRetryScan: () => void
}

export const PortraitPageView = ({
  username,
  isEmpty,
  recordCount,
  estimatedValue,
  valueRange,
  scan,
  onRetryScan,
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
      <PortraitFigures
        recordCount={recordCount}
        estimatedValue={estimatedValue}
        valueRange={valueRange}
      />
      <ScanFigures scan={scan} onRetry={onRetryScan} />
      {/* One attribution for the whole Portrait */}
      <DiscogsAttribution href={discogsCollectionUrl(username)} />
      <PortraitFoot username={username} />
    </>
  )
}

const PortraitTitle = () => (
  <h1 className="type-display mb-6 text-4xl text-foreground">Portrait</h1>
)

interface ScanFiguresProps {
  scan: CollectionScan
  onRetry: () => void
}

// Figures that need every Copy read: the reading state over the sections'
// held shapes until all are, then every section at once, never partial
const ScanFigures = ({ scan, onRetry }: ScanFiguresProps) => {
  if (scan.status === 'reading') {
    return (
      <PortraitHeldSections
        readout={
          <ReadingState
            list="collection"
            size="small"
            read={scan.read}
            total={scan.total}
            requestsLeft={scan.requestsLeft}
          />
        }
      />
    )
  }

  if (scan.status === 'failed') {
    return (
      <p
        role="alert"
        className="type-catalogue mt-10 flex flex-wrap items-center gap-3 text-sm text-muted-foreground"
      >
        Couldn't reach Discogs.
        <Button variant="outline" size="sm" onClick={onRetry}>
          Try again
        </Button>
      </p>
    )
  }

  return (
    <>
      {scan.topArtists.length > 0 && (
        <RankedList
          title="Top artists"
          entries={scan.topArtists.map((artist) => ({
            key: artist.id,
            count: artist.copies,
            label: (
              <Link
                to="/search"
                search={{
                  artistId: String(artist.id),
                  artistName: artist.name,
                }}
                className="text-foreground no-underline hover:underline"
              >
                {artist.name}
              </Link>
            ),
          }))}
        />
      )}
      {scan.topStyles.length > 0 && (
        <RankedList
          title="Top styles"
          entries={scan.topStyles.map((style) => ({
            key: style.name,
            count: style.copies,
            label: style.name,
          }))}
        />
      )}
      {(scan.pressingDecades.decades.length > 0 ||
        scan.pressingDecades.noYear > 0) && (
        <TimeChart
          title="Pressing decade"
          entries={scan.pressingDecades.decades.map(({ decade, copies }) => ({
            key: decade,
            label: `${decade}s`,
            count: copies,
          }))}
          note={
            scan.pressingDecades.noYear > 0 &&
            `${formatRecords(scan.pressingDecades.noYear)} with no year`
          }
        />
      )}
      {scan.additionsByYear.length > 0 && (
        <TimeChart
          title="Additions by year"
          entries={scan.additionsByYear.map(({ year, copies }) => ({
            key: year,
            label: String(year),
            count: copies,
          }))}
        />
      )}
    </>
  )
}

interface PortraitFootProps {
  username: string
}

// Logout lives here, not in the header
const PortraitFoot = ({ username }: PortraitFootProps) => (
  <div className="mt-12 flex flex-wrap items-center gap-2 border-t border-border pt-6">
    <a
      href="/auth/logout"
      className={buttonVariants({ variant: 'outline', size: 'sm' })}
    >
      {username} · Logout
    </a>
  </div>
)
