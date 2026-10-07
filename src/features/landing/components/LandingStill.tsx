import type * as React from 'react'

import { cn } from '#/shared/utils/cn'

interface LandingStillProps {
  children: React.ReactNode
  className?: string
}

// A frame of the product built from real components. Inert: it shows the
// app, it isn't the app, so nothing in it is focusable or clickable.
export const LandingStill = ({ children, className }: LandingStillProps) => (
  <div
    data-slot="landing-still"
    inert
    className={cn(
      'min-w-0 overflow-hidden rounded-(--radius) border border-border bg-background p-4 select-none sm:p-6',
      className,
    )}
  >
    {children}
  </div>
)
