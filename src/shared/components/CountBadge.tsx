import { useCountRoll } from '#/shared/hooks/use-count-roll'

interface CountBadgeProps {
  count: number | undefined
  // Digits roll and the badge fades; off where a score drives the count
  animated?: boolean
}

// Catalogue data → Martian Mono; hidden when there is nothing to count
export const CountBadge = ({ count, animated = true }: CountBadgeProps) => {
  const { isHidden, shown, columns, rootRef } = useCountRoll(count, animated)

  if (isHidden) return null

  return (
    <span
      ref={rootRef}
      role="img"
      aria-label={String(shown)}
      className="flex min-w-4 items-center justify-center rounded-full bg-foreground px-1 py-0.5 font-mono text-[9px] leading-none font-medium text-background tabular-nums [font-stretch:87.5%]"
    >
      <span aria-hidden className="flex">
        {columns.map(({ digit, from }, i) => (
          <span
            key={columns.length - i}
            className="relative inline-block h-[1em] overflow-hidden"
          >
            {digit && (
              <span
                data-roll={from === undefined ? undefined : 'in'}
                className="block"
              >
                {digit}
              </span>
            )}
            {from && (
              <span data-roll="out" className="absolute inset-x-0 top-0 block">
                {from}
              </span>
            )}
          </span>
        ))}
      </span>
    </span>
  )
}
