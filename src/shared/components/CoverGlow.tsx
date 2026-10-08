interface CoverGlowProps {
  tint: string | null
}

// Faint glow and tinted top edge from --cover-tint across a record screen.
// Place it first in a positioned container that sets --cover-tint; it fades
// in once the tint is known and cross-fades when it changes.
export const CoverGlow = ({ tint }: CoverGlowProps) => {
  if (!tint) return null

  return (
    <div
      aria-hidden
      className="cover-glow pointer-events-none absolute inset-0 rounded-[inherit] duration-160 ease-fade animate-in fade-in-0"
    />
  )
}
