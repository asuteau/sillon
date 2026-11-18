import { cn } from '#/shared/utils/cn'

import { coverArt } from '../cover-art.utils'
import type { CoverTheme } from '../cover-art.utils'

interface GeneratedCoverProps {
  artist: string
  title: string
  // The pressing id: the same seed always draws the same art
  seed: number
  className?: string
}

const THEME_CLASS: Record<CoverTheme, string> = {
  light: 'dark:hidden',
  dark: 'hidden dark:block',
}

// A made-up record's Cover on the landing page: original abstract art,
// generated in code, with the artist and title typeset over it. Both themes
// are drawn; the page shows the one it is in.
export const GeneratedCover = ({
  artist,
  title,
  seed,
  className,
}: GeneratedCoverProps) => (
  <div
    aria-hidden
    className={cn(
      '@container relative aspect-square overflow-hidden rounded-(--radius)',
      className,
    )}
    style={{
      '--ink-light': coverArt(seed, 'light').ink,
      '--ink-dark': coverArt(seed, 'dark').ink,
    }}
  >
    {(['light', 'dark'] as const).map((theme) => {
      const { ground, shapes } = coverArt(seed, theme)
      return (
        <div
          key={theme}
          data-theme-art={theme}
          className={cn('absolute inset-0', THEME_CLASS[theme])}
          style={{ background: [...shapes, ground].join(', ') }}
        />
      )
    })}
    <div className="absolute inset-x-[8%] bottom-[8%] flex flex-col gap-[3cqw] text-(--ink-light) dark:text-(--ink-dark)">
      <span className="line-clamp-1 text-[max(7px,6cqw)] leading-tight font-medium tracking-[0.12em] uppercase">
        {artist}
      </span>
      <span className="line-clamp-3 text-[max(9px,12cqw)] leading-[0.95] font-bold tracking-[-0.045em] break-words">
        {title}
      </span>
    </div>
  </div>
)
