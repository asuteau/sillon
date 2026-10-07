interface RecordHeadingProps {
  artist: string
  title: string
  // One catalogue line each (year, format, label · cat no.); empty ones skipped
  catalogue?: (string | null | undefined)[]
}

// Sleeve-style heading for record sheets: artist, title, catalogue lines
export const RecordHeading = ({
  artist,
  title,
  catalogue = [],
}: RecordHeadingProps) => (
  <div className="flex flex-col items-center gap-2 text-center">
    {artist && (
      <p className="type-caps text-xs text-muted-foreground">{artist}</p>
    )}
    <h2 className="type-display text-3xl text-foreground">{title}</h2>
    {catalogue.filter(Boolean).map((line, i) => (
      <p
        key={i}
        className="type-catalogue line-clamp-2 text-[11px] text-balance text-muted-foreground"
      >
        {line}
      </p>
    ))}
  </div>
)
