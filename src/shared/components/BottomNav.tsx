import { Link, useMatch } from '@tanstack/react-router'
import { Heart, Home, Info, Library } from 'lucide-react'

export default function BottomNav() {
  const user = useMatch({
    from: '__root__',
    select: (match) => match.context.user,
  })

  return (
    <div className="fixed inset-x-0 bottom-4 z-50 flex justify-center sm:hidden">
      <nav className="flex items-center gap-1 rounded-full border border-(--chip-line) bg-(--chip-bg) px-2 py-1.5 shadow-[0_8px_24px_rgba(30,90,72,0.12)] backdrop-blur-lg overflow-hidden">
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
              to="/collection"
              className="nav-link flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold"
              activeProps={{
                className:
                  'nav-link is-active flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold',
              }}
            >
              <Library className="h-4 w-4" />
              <span className="nav-label">Collection</span>
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
