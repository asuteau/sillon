import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'

import { collectionValueQueryOptions } from '#/features/collection/collection.queries'
import { profileQueryOptions } from '#/features/profile/profile.queries'

import { portraitTeaser } from '../portrait.utils'

interface PortraitTeaserProps {
  username: string
}

// Home's one line to the Portrait. Cheap figures only: never reads the
// whole Collection.
export const PortraitTeaser = ({ username }: PortraitTeaserProps) => {
  const profile = useQuery(profileQueryOptions(username))
  const value = useQuery(collectionValueQueryOptions(username))

  if (profile.isPending || value.isPending)
    return <div className="mb-6 h-5 w-48 rounded-(--radius) bg-muted" />
  if (!profile.data || profile.data.recordCount === 0) return null

  return (
    <p className="mb-6">
      <Link
        to="/portrait"
        className="type-catalogue text-sm text-muted-foreground no-underline transition-colors duration-160 ease-fade hover:text-foreground"
      >
        {portraitTeaser({
          value: value.data ?? null,
          currency: profile.data.currency,
          recordCount: profile.data.recordCount,
        })}{' '}
        · <span className="text-foreground">Your portrait →</span>
      </Link>
    </p>
  )
}
