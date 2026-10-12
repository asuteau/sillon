import { Link } from '@tanstack/react-router'

import { DISCOGS_NOTICE } from '#/shared/utils/legal'

// On every page, signed in or not. On mobile, the bottom padding clears the
// BottomNav and Scan button.
export const Footer = () => (
  <footer className="mx-auto w-full max-w-270 px-4 pt-6 pb-32 sm:pb-8">
    <div className="type-catalogue flex flex-col gap-2 border-t border-border pt-6 text-[11px] text-muted-foreground sm:flex-row sm:items-start sm:justify-between sm:gap-8">
      <p className="m-0 max-w-[60ch]">{DISCOGS_NOTICE}</p>
      <Link
        to="/legal"
        className="shrink-0 text-muted-foreground no-underline hover:text-foreground hover:underline"
      >
        Legal
      </Link>
    </div>
  </footer>
)
