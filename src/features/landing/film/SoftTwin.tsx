import type * as React from 'react'

import { cn } from '#/shared/utils/cn'

import { round3 } from './film.model'
import type { Shot } from './film.model'
import { Tracked } from './Tracked'

interface SoftTwinProps<TName extends string> {
  // The part's sharp copy, and its soft twin
  sharp: NoInfer<TName>
  soft: NoInfer<TName>
  looks: Shot<TName>
  // The twin's static blur, stage units
  blur: number
  // Each copy's own box
  className?: string
  children: React.ReactNode
}

// A part a film racks focus on (ADR 0005): drawn sharp, and again under a
// static blur, over it, filling its positioned parent. The score fades one
// into the other by opacity: a film never animates a blur, which the
// browser would redraw on the main thread every frame
export const SoftTwin = <TName extends string>({
  sharp,
  soft,
  looks,
  blur,
  className,
  children,
}: SoftTwinProps<TName>) => (
  <>
    <Tracked name={sharp} looks={looks} className={className}>
      {children}
    </Tracked>
    <Tracked
      name={soft}
      looks={looks}
      className={cn('absolute inset-0', className)}
      style={{ filter: `blur(${round3(blur)}cqw)` }}
    >
      {children}
    </Tracked>
  </>
)
