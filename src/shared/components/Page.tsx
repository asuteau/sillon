import { cn } from '#/shared/utils/cn'

interface PageProps {
  children: React.ReactNode
  className?: string
}

// Every screen's content column, below the Header. The Footer below it clears
// the mobile BottomNav and Scan button.
export const Page = ({ children, className }: PageProps) => (
  <main
    className={cn(
      'mx-auto w-full max-w-270 px-4 pt-6 pb-8 sm:pt-10',
      className,
    )}
  >
    {children}
  </main>
)
