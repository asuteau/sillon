import { useQuery } from '@tanstack/react-query'
import { Link, useMatch } from '@tanstack/react-router'
import { Heart, Home, Info, Library, PlusCircle } from 'lucide-react'

import { profileQueryOptions } from '#/features/profile/profile.queries'
import { CountBadge } from '#/shared/components/CountBadge'

// Active state from the router's data-status; only the active tab shows its label
const TAB =
  'group/tab flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold text-muted-foreground no-underline transition-colors duration-160 ease-fade hover:text-foreground data-[status=active]:bg-foreground data-[status=active]:text-background'
const TAB_LABEL = 'hidden group-data-[status=active]/tab:inline'

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
        <Link to="/" className={TAB}>
          <Home className="size-4" />
          <span className={TAB_LABEL}>Home</span>
        </Link>
        {user && (
          <>
            <Link to="/search" className={TAB}>
              <PlusCircle className="size-4" />
              <span className={TAB_LABEL}>Add</span>
            </Link>
            <Link to="/collection" className={TAB}>
              <Library className="size-4" />
              <span className={TAB_LABEL}>Collection</span>
              <CountBadge count={collectionCount} />
            </Link>
            <Link to="/wantlist" className={TAB}>
              <Heart className="size-4" />
              <span className={TAB_LABEL}>Wantlist</span>
              <CountBadge count={wantlistCount} />
            </Link>
          </>
        )}
        <Link to="/about" className={TAB}>
          <Info className="size-4" />
          <span className={TAB_LABEL}>About</span>
        </Link>
      </nav>
    </div>
  )
}
