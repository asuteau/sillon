import type * as React from 'react'

import { cn } from '#/shared/utils/cn'

interface ChipProps extends React.ComponentProps<'button'> {
  active?: boolean
}

// Pressable = round like a record; the active chip is solid foreground
export const Chip = ({ active = false, className, ...props }: ChipProps) => (
  <button
    type="button"
    data-slot="chip"
    aria-pressed={active}
    className={cn(
      'flex cursor-pointer items-center gap-1 rounded-full border px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors duration-160 ease-fade focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground',
      active
        ? 'border-foreground bg-foreground text-background'
        : 'border-border text-muted-foreground hover:text-foreground',
      className,
    )}
    {...props}
  />
)
