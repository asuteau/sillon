// undefined = still loading
interface PortraitFiguresProps {
  recordCount: string
  estimatedValue: string | undefined
  valueRange: string | undefined
}

// The Portrait's headline: Estimated value and Records, side by side
export const PortraitFigures = ({
  recordCount,
  estimatedValue,
  valueRange,
}: PortraitFiguresProps) => (
  <section aria-label="Your Collection">
    <dl className="m-0 grid grid-cols-2 divide-x divide-border rounded-(--radius) border border-border bg-card py-4">
      <Figure
        label="Estimated value"
        value={estimatedValue}
        hint={valueRange}
      />
      <Figure label="Records" value={recordCount} />
    </dl>
  </section>
)

interface FigureProps {
  label: string
  value: string | undefined
  hint?: string
}

const Figure = ({ label, value, hint }: FigureProps) => (
  <div className="flex flex-col items-center gap-1 px-2 text-center">
    <dt className="type-caps text-[11px] text-muted-foreground">{label}</dt>
    <dd className="m-0 flex flex-col items-center gap-0.5">
      {value === undefined ? (
        <span className="h-7 w-16 rounded-(--radius) bg-muted" />
      ) : (
        // Counts are catalogue data; set large here as the headline
        <span className="type-catalogue text-2xl leading-7 font-medium text-foreground">
          {value}
        </span>
      )}
      {hint && (
        <span className="type-catalogue text-[10px] text-muted-foreground">
          {hint}
        </span>
      )}
    </dd>
  </div>
)
