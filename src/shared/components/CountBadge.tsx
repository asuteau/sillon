interface CountBadgeProps {
  count: number | undefined
}

// Catalogue data → Martian Mono; hidden when there is nothing to count
export const CountBadge = ({ count }: CountBadgeProps) => {
  if (!count) return null

  return (
    <span className="flex min-w-4 items-center justify-center rounded-full bg-foreground px-1 py-0.5 font-mono text-[9px] leading-none font-medium text-background [font-stretch:87.5%]">
      {count}
    </span>
  )
}
