import { useQuery } from '@tanstack/react-query'
import { Link, useMatch } from '@tanstack/react-router'
import { Heart, Home, Info, Library, PlusCircle } from 'lucide-react'

import { profileQueryOptions } from '#/features/profile/profile.queries'
import { CountBadge } from '#/shared/components/CountBadge'

// Active state from the router's data-status; only the active tab shows its label
const TAB_CLASSES =
  'group/tab flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold text-muted-foreground no-underline transition-colors duration-160 ease-fade hover:text-foreground data-[status=active]:bg-muted data-[status=active]:text-foreground'
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
          <Home className="size-4" />
          <span className={TAB_LABEL_CLASSES}>Home</span>
        </Link>
        {user && (
          <>
            <Link to="/search" className={TAB_CLASSES}>
              <PlusCircle className="size-4" />
              <span className={TAB_LABEL_CLASSES}>Add</span>
            </Link>
            <Link to="/collection" className={TAB_CLASSES}>
              <Library className="size-4" />
              <span className={TAB_LABEL_CLASSES}>Collection</span>
              <CountBadge count={collectionCount} />
            </Link>
            <Link to="/wantlist" className={TAB_CLASSES}>
              <Heart className="size-4" />
              <span className={TAB_LABEL_CLASSES}>Wantlist</span>
              <CountBadge count={wantlistCount} />
            </Link>
          </>
        )}
        <Link to="/about" className={TAB_CLASSES}>
          <Info className="size-4" />
          <span className={TAB_LABEL_CLASSES}>About</span>
        </Link>
      </nav>
    </div>
  )
}
