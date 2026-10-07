// The landing hero's ~12s animation as timed cues. Beat 1 plays once; beats
// 2–4 then loop. Times are playing time: the clock stops while paused.

export type ScanStep = 'aim' | 'match' | 'added' | 'fulfilled'

export type HeroScene =
  // 1. The groove draws in, then the wordmark appears
  | { beat: 'intro'; wordmark: boolean }
  // 2. House sleeves fill a Collection grid
  | { beat: 'collection'; loaded: number }
  // 3. A barcode scan matches a Release, it's added, a Fulfilled want prompt
  | { beat: 'scan'; step: ScanStep }
  // 4. A cover grows into its detail page
  | { beat: 'detail'; open: boolean }

interface HeroCue {
  at: number
  scene: HeroScene
}

export const HERO_GRID_SIZE = 9

// Covers arrive in the order real images would: not row by row
const LOAD_ORDER: readonly number[] = [4, 0, 7, 2, 5, 8, 1, 6, 3]
const LOAD_TIMES = [250, 420, 700, 820, 1100, 1350, 1500, 1800, 2050] as const

const INTRO_MS = 2000
const INTRO_CUES: readonly HeroCue[] = [
  { at: 0, scene: { beat: 'intro', wordmark: false } },
  // The groove's ~800ms draw-in, then a beat
  { at: 900, scene: { beat: 'intro', wordmark: true } },
]

// From the start of beat 2
const LOOP_MS = 10_000
const LOOP_CUES: readonly HeroCue[] = [
  { at: 0, scene: { beat: 'collection', loaded: 0 } },
  ...LOAD_TIMES.map((at, i) => ({
    at,
    scene: { beat: 'collection', loaded: i + 1 } as const,
  })),
  { at: 3000, scene: { beat: 'scan', step: 'aim' } },
  { at: 4200, scene: { beat: 'scan', step: 'match' } },
  { at: 5200, scene: { beat: 'scan', step: 'added' } },
  { at: 5900, scene: { beat: 'scan', step: 'fulfilled' } },
  { at: 7000, scene: { beat: 'detail', open: false } },
  { at: 7600, scene: { beat: 'detail', open: true } },
]

// What reduced motion shows instead: the grid, every cover in
export const HERO_STILL: HeroScene = {
  beat: 'collection',
  loaded: HERO_GRID_SIZE,
}

const lastCueAt = (cues: readonly HeroCue[], ms: number) =>
  cues.reduce((last, cue) => (cue.at <= ms ? cue : last), cues[0])

const position = (elapsed: number) =>
  elapsed < INTRO_MS
    ? { cues: INTRO_CUES, ms: elapsed, length: INTRO_MS }
    : { cues: LOOP_CUES, ms: (elapsed - INTRO_MS) % LOOP_MS, length: LOOP_MS }

export const heroSceneAt = (elapsed: number): HeroScene => {
  const { cues, ms } = position(elapsed)
  return lastCueAt(cues, ms).scene
}

// Time to the next cue; past the last cue of a section, to the loop's start
export const msUntilNextCue = (elapsed: number): number => {
  const { cues, ms, length } = position(elapsed)
  const next = cues.find((cue) => cue.at > ms)
  return (next?.at ?? length) - ms
}

export const isCoverLoaded = (cell: number, loaded: number): boolean =>
  LOAD_ORDER.indexOf(cell) < loaded
