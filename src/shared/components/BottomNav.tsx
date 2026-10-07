import { useQuery } from '@tanstack/react-query'
import { Link, useMatch } from '@tanstack/react-router'
import { Info } from 'lucide-react'

import { profileQueryOptions } from '#/features/profile/profile.queries'
import { CountBadge } from '#/shared/components/CountBadge'
import { CollectionIcon } from '#/shared/components/icons/CollectionIcon'
import { HomeIcon } from '#/shared/components/icons/HomeIcon'
import { SearchIcon } from '#/shared/components/icons/SearchIcon'
import { WantlistIcon } from '#/shared/components/icons/WantlistIcon'

// Active state from the router's data-status; only the active tab shows its label
const TAB_CLASSES =
  'group/tab flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground no-underline transition-colors duration-160 ease-fade hover:text-foreground data-[status=active]:bg-muted data-[status=active]:font-semibold data-[status=active]:text-foreground'
const TAB_LABEL_CLASSES = 'hidden group-data-[status=active]/tab:inline'

export default function BottomNav() {
  const user = useMatch({
    from: '__root__',
    select: (match) => match.context.user,
  })

  const { data: profile } = useQuery({
    ...profileQueryOptions(user?.username ?? ''),
    enabled: !!user,
  })
  const collectionCount = profile?.recordCount
  const wantlistCount = profile?.wantlistCount

  return (
    <div className="fixed inset-x-0 bottom-4 z-50 flex justify-center sm:hidden">
      <nav className="flex items-center gap-1 overflow-hidden rounded-full border border-border bg-card/90 px-2 py-1.5 shadow-[0_8px_24px_rgb(0_0_0/0.12)] backdrop-blur-lg">
        <Link to="/" className={TAB_CLASSES}>
          <HomeIcon className="size-4" />
          <span className={TAB_LABEL_CLASSES}>Home</span>
        </Link>
        {user && (
          <>
            <Link to="/collection" className={TAB_CLASSES}>
              <CollectionIcon className="size-4" />
              <span className={TAB_LABEL_CLASSES}>Collection</span>
              <CountBadge count={collectionCount} />
            </Link>
            <Link to="/search" className={TAB_CLASSES}>
              <SearchIcon className="size-4" />
              <span className={TAB_LABEL_CLASSES}>Search</span>
            </Link>
            <Link to="/wantlist" className={TAB_CLASSES}>
              <WantlistIcon className="size-4" />
              <span className={TAB_LABEL_CLASSES}>Wantlist</span>
              <CountBadge count={wantlistCount} />
            </Link>
          </>
        )}
        {/* The Colophon, at the foot of the landing page (no Header nav on mobile) */}
        <Link
          to="/"
          hash="colophon"
          activeOptions={{ includeHash: true }}
          className={TAB_CLASSES}
        >
          <Info className="size-4" />
          <span className={TAB_LABEL_CLASSES}>About</span>
        </Link>
      </nav>
    </div>
  )
}
