import { cn } from '#/shared/utils/cn'

interface PageProps {
  children: React.ReactNode
  className?: string
}

// Every screen's content column, below the Header. Bottom padding clears the
// mobile BottomNav and Scan button.
export const Page = ({ children, className }: PageProps) => (
  <main
    className={cn(
      'mx-auto w-full max-w-270 px-4 pt-6 pb-32 sm:pt-10 sm:pb-8',
      className,
    )}
  >
    {children}
  </main>
)
