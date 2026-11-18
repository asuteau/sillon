import { GrooveMark } from '#/shared/components/brand/GrooveMark'
import { Wordmark } from '#/shared/components/brand/Wordmark'
import { ThemeToggle } from '#/shared/components/ThemeToggle'
import { buttonVariants } from '#/shared/components/ui/button'

const ANCHOR_CLASSES =
  'rounded-(--radius) text-sm font-semibold text-muted-foreground no-underline transition-colors duration-160 ease-fade hover:text-foreground'

// The landing's own sticky header, in place of the app's. Anchors stay on the
// page; Connect is always one tap away. On a phone the anchors take a second,
// shorter row under the wordmark and Connect, so nothing scrolls sideways.
export const LandingHeader = () => (
  <header className="sticky top-0 z-50 border-b border-border bg-background/85 px-4 backdrop-blur-lg">
    <nav
      aria-label="Sections"
      className="mx-auto flex w-full max-w-270 flex-wrap items-center gap-x-5 pt-3 pb-2 sm:flex-nowrap sm:py-4"
    >
      <a
        href="#top"
        aria-label="Sillon, back to the top"
        className="inline-flex shrink-0 items-center gap-2.5 rounded-(--radius) text-foreground no-underline"
      >
        <GrooveMark size={26} />
        <Wordmark className="text-2xl" />
      </a>
      <div className="order-last flex w-full gap-x-5 pt-2 sm:order-none sm:w-auto sm:pt-0">
        <a href="#features" className={ANCHOR_CLASSES}>
          Features
        </a>
        <a href="#portrait" className={ANCHOR_CLASSES}>
          Portrait
        </a>
        <a href="#liner-notes" className={ANCHOR_CLASSES}>
          Liner notes
        </a>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <ThemeToggle />
        <a
          href="/auth/login"
          className={buttonVariants({ variant: 'default', size: 'sm' })}
        >
          Connect
        </a>
      </div>
    </nav>
  </header>
)
