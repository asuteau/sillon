import { useQuery } from '@tanstack/react-query'
import { Link, useMatch } from '@tanstack/react-router'
import { Heart, Home, Info, Library, PlusCircle } from 'lucide-react'

import { profileQueryOptions } from '#/features/profile/profile.queries'

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
      <nav className="flex items-center gap-1 overflow-hidden rounded-full border border-(--chip-line) bg-(--chip-bg) px-2 py-1.5 shadow-[0_8px_24px_rgba(30,90,72,0.12)] backdrop-blur-lg">
        <Link
          to="/"
          className="nav-link flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold"
          activeProps={{
            className:
              'nav-link is-active flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold',
          }}
        >
          <Home className="h-4 w-4" />
          <span className="nav-label">Home</span>
        </Link>
        {user && (
          <>
            <Link
              to="/search"
              className="nav-link flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold"
              activeProps={{
                className:
                  'nav-link is-active flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold',
              }}
            >
              <PlusCircle className="h-4 w-4" />
              <span className="nav-label">Add</span>
            </Link>
            <Link
              to="/collection"
              className="nav-link flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold"
              activeProps={{
                className:
                  'nav-link is-active flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold',
              }}
            >
              <Library className="h-4 w-4" />
              <span className="nav-label">Collection</span>
              {(collectionCount ?? 0) > 0 && (
                <span className="flex min-w-3.5 items-center justify-center rounded-full bg-(--sea-ink) px-1 py-1 text-[8px] font-bold leading-tight text-(--chip-bg)">
                  {collectionCount}
                </span>
              )}
            </Link>
            <Link
              to="/wantlist"
              className="nav-link flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold"
              activeProps={{
                className:
                  'nav-link is-active flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold',
              }}
            >
              <Heart className="h-4 w-4" />
              <span className="nav-label">Wantlist</span>
              {(wantlistCount ?? 0) > 0 && (
                <span className="flex min-w-3.5 items-center justify-center rounded-full bg-(--sea-ink) px-1 py-1 text-[8px] font-bold leading-tight text-(--chip-bg)">
                  {wantlistCount}
                </span>
              )}
            </Link>
          </>
        )}
        <Link
          to="/about"
          className="nav-link flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold"
          activeProps={{
            className:
              'nav-link is-active flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold',
          }}
        >
          <Info className="h-4 w-4" />
          <span className="nav-label">About</span>
        </Link>
      </nav>
    </div>
  )
}
