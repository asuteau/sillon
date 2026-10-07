import type * as React from 'react'

import { cn } from '#/shared/utils/cn'

interface FeatureSectionProps {
  id: string
  // Small caps label above the title, e.g. the feature's glossary name
  label: string
  title: string
  children: React.ReactNode
  still: React.ReactNode
  // Puts the still on the left from md up, to alternate down the page
  flip?: boolean
}

export const FeatureSection = ({
  id,
  label,
  title,
  children,
  still,
  flip = false,
}: FeatureSectionProps) => (
  <section
    aria-labelledby={`${id}-title`}
    className="border-t border-border py-14 sm:py-20"
  >
    <div className="grid items-center gap-8 md:grid-cols-2 md:gap-14">
      <div className={cn('flex flex-col gap-4', flip && 'md:order-2')}>
        <p className="type-caps text-[11px] text-muted-foreground">{label}</p>
        <h2
          id={`${id}-title`}
          className="type-display text-4xl text-balance text-foreground sm:text-5xl"
        >
          {title}
        </h2>
        <div className="flex max-w-md flex-col gap-3 text-base text-muted-foreground">
          {children}
        </div>
      </div>
      {still}
    </div>
  </section>
)
