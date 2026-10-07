import type { CSSProperties } from 'react'

import { cn } from '#/shared/utils/cn'
import { houseSleeve } from '#/shared/utils/house-sleeve'
import type {
  HouseSleeveDesign,
  HouseSleeveRecord,
  SleevePlacement,
} from '#/shared/utils/house-sleeve'

interface HouseSleeveProps extends HouseSleeveRecord {
  className?: string
}

const LACQUER: CSSProperties = { background: 'var(--lacquer)' }
const RULE_COUNT = 7

const isTop = (placement: SleevePlacement) => placement.startsWith('top')
const isLeft = (placement: SleevePlacement) => placement.endsWith('left')

const Shape = ({ layout, placement, composition }: HouseSleeveDesign) => {
  const top = isTop(placement)
  const left = isLeft(placement)

  if (layout === 'band') {
    return (
      <div
        className={cn(
          'absolute inset-x-0 h-[22%]',
          top ? 'top-[12%]' : 'bottom-[12%]',
        )}
        style={LACQUER}
      />
    )
  }

  if (layout === 'block') {
    return (
      <div
        className={cn(
          'absolute size-[46%]',
          top ? 'top-0' : 'bottom-0',
          left ? 'left-0' : 'right-0',
        )}
        style={LACQUER}
      />
    )
  }

  if (layout === 'rules') {
    return (
      <div
        className={cn(
          'absolute inset-x-[8%] flex h-[42%] flex-col justify-between',
          top ? 'top-[8%]' : 'bottom-[8%]',
        )}
      >
        {Array.from({ length: RULE_COUNT }, (_, i) => (
          <div
            key={i}
            className="h-[max(1px,1.2%)] min-h-px"
            style={i === 0 ? LACQUER : { background: composition.ink }}
          />
        ))}
      </div>
    )
  }

  if (layout === 'circle') {
    return (
      <div
        className={cn(
          'absolute size-[92%] rounded-full',
          top ? '-top-[34%]' : '-bottom-[34%]',
          left ? '-left-[34%]' : '-right-[34%]',
        )}
        style={LACQUER}
      />
    )
  }

  return (
    <div
      className={cn(
        'absolute left-[8%] h-[3%] w-[30%]',
        top ? 'top-[8%]' : 'bottom-[8%]',
      )}
      style={LACQUER}
    />
  )
}

// Generated Cover for a record with no artwork. Below ~88px the full type
// would be unreadable, so it shows the title's initial instead.
export const HouseSleeve = ({
  artist,
  title,
  coverKey,
  className,
}: HouseSleeveProps) => {
  const design = houseSleeve({ artist, title, coverKey })
  const { composition, layout, placement } = design
  const textAtTop = !isTop(placement)
  const initial = (title.trim() || artist.trim()).charAt(0).toUpperCase()

  return (
    <div
      aria-hidden
      data-layout={layout}
      className={cn(
        '@container relative aspect-square overflow-hidden rounded-lg',
        className,
      )}
      style={{ background: composition.ground, color: composition.ink }}
    >
      <Shape {...design} />

      <span
        className={cn(
          'absolute left-[10%] text-[52cqw] leading-[0.8] font-bold tracking-[-0.045em] @min-[88px]:hidden',
          textAtTop ? 'top-[10%]' : 'bottom-[10%]',
        )}
      >
        {initial}
      </span>

      <div
        className={cn(
          'absolute inset-x-[8%] hidden flex-col gap-[3cqw] @min-[88px]:flex',
          textAtTop ? 'top-[8%]' : 'bottom-[8%]',
        )}
      >
        <span className="line-clamp-1 text-[max(7px,6cqw)] leading-tight font-medium tracking-[0.12em] uppercase">
          {artist}
        </span>
        <span
          className={cn(
            'line-clamp-3 leading-[0.95] font-bold tracking-[-0.045em] break-words',
            layout === 'stack' ? 'text-[16cqw]' : 'text-[max(9px,12cqw)]',
          )}
        >
          {title}
        </span>
      </div>
    </div>
  )
}
