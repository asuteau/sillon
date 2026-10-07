import type * as React from 'react'

import { cn } from '#/shared/utils/cn'

// Rows on hairlines, no cards: square like a sleeve
export const RecordList = ({
  className,
  ...props
}: React.ComponentProps<'ul'>) => (
  <ul
    className={cn(
      'divide-y divide-border border-y border-border transition-opacity duration-160 ease-fade aria-busy:opacity-50',
      className,
    )}
    {...props}
  />
)

// Square cover slot for RecordRow
export const RECORD_ROW_MEDIA_CLASSES =
  'size-12 shrink-0 overflow-hidden rounded-(--radius)'

interface RecordRowProps {
  media: React.ReactNode
  title: string
  artist?: string
  // Muted line under the title, e.g. an artist profile
  description?: string | null
  // Catalogue line on the right: year, date added…
  meta?: React.ReactNode
  // Before the catalogue line, e.g. owned / wanted marks
  badges?: React.ReactNode
  onClick: () => void
}

export const RecordRow = ({
  media,
  title,
  artist,
  description,
  meta,
  badges,
  onClick,
}: RecordRowProps) => (
  <button
    type="button"
    onClick={onClick}
    className="flex w-full cursor-pointer items-center gap-4 px-1 py-3 text-left transition-colors duration-160 ease-fade hover:bg-muted"
  >
    {media}
    <span className="flex min-w-0 flex-1 flex-col gap-1">
      {artist && (
        <span className="type-caps truncate text-[11px] text-muted-foreground">
          {artist}
        </span>
      )}
      <span className="type-title truncate text-[15px] text-foreground">
        {title}
      </span>
      {description && (
        <span className="line-clamp-1 text-xs text-muted-foreground">
          {description}
        </span>
      )}
    </span>
    {badges}
    {meta != null && (
      <span className="type-catalogue shrink-0 text-[11px] text-muted-foreground">
        {meta}
      </span>
    )}
  </button>
)
