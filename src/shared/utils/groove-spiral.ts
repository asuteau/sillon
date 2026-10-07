// The groove: a single Archimedean spiral, centred in a 100×100 box by default,
// outer end first so a stroke-dashoffset animation draws it in from the edge
// like a needle.

interface GrooveSpiralOptions {
  turns: number
  innerRadius: number
  outerRadius: number
  /** Defaults to the centre of the 100×100 box; icons pass their own grid */
  centre?: { x: number; y: number }
}

const BOX_CENTRE = { x: 50, y: 50 }
const STEPS_PER_TURN = 72

export const grooveSpiralPath = ({
  turns,
  innerRadius,
  outerRadius,
  centre = BOX_CENTRE,
}: GrooveSpiralOptions): string => {
  const steps = Math.ceil(turns * STEPS_PER_TURN)
  const points: string[] = []
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    // Start at 12 o'clock, wind clockwise
    const angle = -Math.PI / 2 + t * turns * 2 * Math.PI
    const radius = outerRadius - (outerRadius - innerRadius) * t
    const x = centre.x + radius * Math.cos(angle)
    const y = centre.y + radius * Math.sin(angle)
    points.push(`${x.toFixed(2)} ${y.toFixed(2)}`)
  }
  return `M${points.join(' L')}`
}

// Fewer turns at small sizes so the groove stays legible
export const grooveTurnsForSize = (size: number): number => {
  if (size >= 90) return 9
  if (size >= 48) return 6
  if (size >= 30) return 4
  return 2.5
}

export const GROOVE_INNER_RADIUS = 3
export const GROOVE_OUTER_RADIUS = 45

// Stroke fills ~38% of the nominal gap between grooves (from the mark
// specimen), thicker at favicon sizes
export const grooveStrokeWidth = (size: number): number => {
  const gap = 40 / grooveTurnsForSize(size)
  return Math.max(gap * 0.38, size < 24 ? 5.5 : 1.6)
}
