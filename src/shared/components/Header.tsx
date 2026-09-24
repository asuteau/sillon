import { ShuffleButton } from '#/features/collection/components/ShuffleButton'
import { profileQueryOptions } from '#/features/profile/profile.queries'
import { useQuery } from '@tanstack/react-query'
import { Link, useMatch } from '@tanstack/react-router'
import { LogOut } from 'lucide-react'
import { ScanButton } from './ScanButton'
import ThemeToggle from './ThemeToggle'

export default function Header() {
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
    <header className="sticky top-0 z-50 border-b border-(--line) bg-(--header-bg) px-4 backdrop-blur-lg">
      <nav className="page-wrap flex flex-wrap items-center gap-x-3 gap-y-2 py-3 sm:py-4">
        <h2 className="m-0 shrink-0 text-base font-semibold tracking-tight">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full border border-(--chip-line) bg-(--chip-bg) px-3 py-1.5 text-sm text-(--sea-ink) no-underline shadow-[0_8px_24px_rgba(30,90,72,0.08)] sm:px-4 sm:py-2"
          >
            <span className="h-2 w-2 rounded-full bg-[linear-gradient(90deg,#56c6be,#7ed3bf)]" />
            Sillon
          </Link>
        </h2>

        <div className="hidden w-full flex-wrap items-center gap-x-4 gap-y-1 pb-1 text-sm font-semibold sm:flex sm:w-auto sm:flex-nowrap sm:pb-0">
          {user && (
            <>
              <Link
                to="/search"
                className="nav-link"
                activeProps={{ className: 'nav-link is-active' }}
              >
                Add
              </Link>
              <Link
                to="/collection"
                className="nav-link gap-1.5"
                activeProps={{ className: 'nav-link is-active gap-1.5' }}
              >
                Collection
                {(collectionCount ?? 0) > 0 && (
                  <span className="flex min-w-3.5 items-center justify-center rounded-full bg-(--sea-ink) px-1 py-1 text-[8px] font-bold leading-tight text-(--chip-bg)">
                    {collectionCount}
                  </span>
                )}
              </Link>
              <Link
                to="/wantlist"
                className="nav-link gap-1.5"
                activeProps={{ className: 'nav-link is-active gap-1.5' }}
              >
                Wantlist
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
            className="nav-link"
            activeProps={{ className: 'nav-link is-active' }}
          >
            About
          </Link>
        </div>

        <div className="ml-auto flex items-center gap-3">
          {user && (
            <div className="hidden sm:flex">
              <ScanButton />
            </div>
          )}
          {user && <ShuffleButton />}
          <ThemeToggle />
          {user ? (
            <a
              href="/auth/logout"
              className="flex items-center gap-1.5 rounded-full border border-(--chip-line) bg-(--chip-bg) px-3 py-1.5 text-sm font-semibold text-(--sea-ink) no-underline transition hover:bg-(--lagoon)/10"
              aria-label={`Logout ${user.username}`}
            >
              <LogOut className="h-4 w-4 sm:hidden" />
              <span className="hidden sm:inline">{user.username} · Logout</span>
            </a>
          ) : (
            <a
              href="/auth/login"
              className="rounded-full border border-[rgba(50,143,151,0.4)] bg-[rgba(79,184,178,0.14)] px-3 py-1.5 text-sm font-semibold text-(--lagoon-deep) no-underline transition hover:bg-[rgba(79,184,178,0.24)]"
            >
              Connect with Discogs
            </a>
          )}
        </div>
      </nav>
    </header>
  )
}
