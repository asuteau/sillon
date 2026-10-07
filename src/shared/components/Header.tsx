import { profileQueryOptions } from '#/features/profile/profile.queries'
import { useQuery } from '@tanstack/react-query'
import { Link, useMatch } from '@tanstack/react-router'
import { LogOut } from 'lucide-react'
import { CountBadge } from './CountBadge'
import { GrooveMark } from './brand/GrooveMark'
import { Wordmark } from './brand/Wordmark'
import { ScanButton } from './ScanButton'
import ThemeToggle from './ThemeToggle'
import { buttonVariants } from './ui/button'

// Active state from the router's data-status; underline fades in
const NAV_LINK_CLASSES =
  'relative inline-flex items-center gap-1.5 rounded-(--radius) text-muted-foreground no-underline transition-colors duration-160 ease-fade after:absolute after:inset-x-0 after:-bottom-1.5 after:h-px after:bg-current after:opacity-0 after:transition-opacity after:duration-160 after:ease-fade hover:text-foreground hover:after:opacity-100 data-[status=active]:text-foreground data-[status=active]:after:opacity-100'

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
    <header className="sticky top-0 z-50 border-b border-border bg-background/85 px-4 backdrop-blur-lg">
      <nav className="mx-auto flex w-full max-w-270 flex-wrap items-center gap-x-3 gap-y-2 py-3 sm:py-4">
        <h2 className="m-0 shrink-0">
          <Link
            to="/"
            aria-label="Sillon home"
            className="inline-flex items-center gap-2.5 rounded-(--radius) text-foreground no-underline"
          >
            <GrooveMark size={26} />
            <Wordmark className="text-2xl" />
          </Link>
        </h2>

        <div className="hidden w-full flex-wrap items-center gap-x-4 gap-y-1 pb-1 text-sm font-semibold sm:flex sm:w-auto sm:flex-nowrap sm:pb-0">
          {user && (
            <>
              <Link to="/search" className={NAV_LINK_CLASSES}>
                Add
              </Link>
              <Link to="/collection" className={NAV_LINK_CLASSES}>
                Collection
                <CountBadge count={collectionCount} />
              </Link>
              <Link to="/wantlist" className={NAV_LINK_CLASSES}>
                Wantlist
                <CountBadge count={wantlistCount} />
              </Link>
            </>
          )}
          <Link to="/about" className={NAV_LINK_CLASSES}>
            About
          </Link>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {user && (
            <div className="hidden sm:flex">
              <ScanButton />
            </div>
          )}
          <ThemeToggle />
          {user ? (
            <a
              href="/auth/logout"
              className={buttonVariants({ variant: 'outline', size: 'sm' })}
              aria-label={`Logout ${user.username}`}
            >
              <LogOut className="sm:hidden" />
              <span className="hidden sm:inline">{user.username} · Logout</span>
            </a>
          ) : (
            <a
              href="/auth/login"
              className={buttonVariants({ variant: 'default', size: 'sm' })}
            >
              Connect with Discogs
            </a>
          )}
        </div>
      </nav>
    </header>
  )
}
