import { RotateCcw } from 'lucide-react'
import { useMemo } from 'react'

import { LIST_NAMES, plural } from '#/features/scan/components/StackBar'
import { CollectionIcon } from '#/shared/components/icons/CollectionIcon'
import { Button } from '#/shared/components/ui/button'
import { usePrefersReducedMotion } from '#/shared/hooks/use-prefers-reduced-motion'

import { HeroSet, Tracked } from './HeroSet'
import type { HeroLooks } from './HeroSet'
import { NO_BEATS } from '../film/film.model'
import { useFilmPlayer } from '../hooks/use-film-player'
import { useHeroFraming } from '../hooks/use-hero-framing'
import { LAYOUT } from '../hero/hero-cues.score'
import { HERO_SCORES, HERO_STAGES, softBlur } from '../hero/hero.score'
import type { HeroFraming } from '../hero/hero.score'

// Frameless: every edge of the stage falls back into the page
const STAGE_MASK =
  'linear-gradient(90deg, transparent, black 10%, black 90%, transparent), linear-gradient(transparent, black 8%, black 88%, transparent)'

interface StackHudProps {
  looks: HeroLooks
  centre: number
}

// The Stack's bar, as the app pins it under the Stack: the count, then the
// one confirm; once confirmed, the app's own line
const StackHud = ({ looks, centre }: StackHudProps) => (
  <div
    className="absolute bottom-[7%] flex w-0 justify-center"
    style={{ left: `${centre * 100}%` }}
  >
    <Tracked
      name="hud"
      looks={looks}
      className="flex shrink-0 items-center gap-4 rounded-full border border-border bg-card/90 py-1.5 pr-1.5 pl-5 shadow-lg"
    >
      <span className="flex items-baseline gap-2">
        <span className="type-caps text-xs text-muted-foreground">Stack</span>
        <span className="relative inline-block h-[1.2em] w-[1ch] overflow-hidden type-catalogue text-base text-foreground">
          {([1, 2, 3] as const).map((n) => (
            <Tracked
              key={n}
              name={`hud-n${n}`}
              looks={looks}
              className="absolute inset-0"
            >
              {n}
            </Tracked>
          ))}
        </span>
      </span>
      <span className="relative flex h-9 items-center">
        <Tracked
          name="hud-hint"
          looks={looks}
          className="absolute right-0 pr-4 text-sm whitespace-nowrap text-muted-foreground"
        >
          Point at barcode
        </Tracked>
        <Tracked
          name="hud-btn"
          looks={looks}
          className="relative flex h-9 items-center gap-2 overflow-hidden rounded-full bg-primary px-4 text-sm font-medium whitespace-nowrap text-primary-foreground"
        >
          <CollectionIcon className="size-4" />
          Add 3 to Collection
          <Tracked
            name="hud-press"
            looks={looks}
            className="absolute inset-0 bg-background/25"
          />
        </Tracked>
      </span>
    </Tracked>
    <Tracked
      name="added"
      looks={looks}
      className="absolute bottom-0 flex h-12 shrink-0 items-center gap-2 rounded-full border border-border bg-card/90 px-5 text-sm whitespace-nowrap text-foreground shadow-lg"
    >
      <CollectionIcon className="size-4" />
      {`${plural(3, 'record')} added to your ${LIST_NAMES.collection}.`}
    </Tracked>
  </div>
)

const cqw = (n: number) => `${Math.round(n * 1000) / 1000}cqw`

interface HeroStageProps {
  framing: HeroFraming
}

// The film on its stage, and Replay once it has ended
const HeroStage = ({ framing }: HeroStageProps) => {
  const score = HERO_SCORES[framing]
  const { stageRef, at, hasEnded, replay } = useFilmPlayer(score, NO_BEATS)
  // Sampled once per rest pose: the set (hundreds of elements) re-renders
  // only when it moves to a new one
  const looks = useMemo(() => score.sample(at), [score, at])
  const { perspective, unit, centre } = HERO_STAGES[framing]

  return (
    <>
      <div
        ref={stageRef}
        data-slot="hero-film"
        inert
        aria-hidden
        className="@container absolute inset-0 overflow-hidden select-none"
      >
        <div
          className="absolute inset-0 bg-background"
          style={{
            perspective: cqw(perspective),
            perspectiveOrigin: `${centre * 100}% 50%`,
            maskImage: STAGE_MASK,
            maskComposite: 'intersect',
          }}
        >
          <Tracked
            name="world"
            looks={looks}
            className="absolute top-1/2 size-0 transform-3d"
            style={{ left: `${centre * 100}%` }}
          >
            <HeroSet
              unit={unit}
              soft={softBlur(HERO_STAGES[framing])}
              layout={LAYOUT[framing]}
              looks={looks}
            />
          </Tracked>
          {/* The Challenge's cold grade: colour drained */}
          <Tracked
            name="grade"
            looks={looks}
            className="pointer-events-none absolute inset-0 bg-[oklch(0.6_0_0)] mix-blend-saturation"
          />
          <Tracked
            name="exposure"
            looks={looks}
            className="pointer-events-none absolute inset-0 bg-background"
          />
        </div>
        <StackHud looks={looks} centre={centre} />
      </div>
      {hasEnded && (
        <Button
          variant="outline"
          size="sm"
          onClick={replay}
          className="absolute right-4 bottom-3 animate-in bg-background/70 fade-in sm:right-6 sm:bottom-5"
        >
          <RotateCcw />
          Replay
        </Button>
      )}
    </>
  )
}

// The landing's hero film (#109): cold Discogs rows flip into HD Covers, a
// Stack of three sleeves is scanned and added in one go, the newest record
// comes out of the wall and its disc slides out in its Vinyl colour; then
// the camera pulls back and holds. Full width, 16:9 or about 4:5 for the
// screen; decorative and inert but for Replay; pauses off-screen and in a
// hidden tab; one still with reduced motion.
export const HeroFilm = () => {
  const framing = useHeroFraming()
  const reducedMotion = usePrefersReducedMotion()

  return (
    <div className="relative mx-auto aspect-4/5 w-full max-w-360 md:aspect-video">
      {/* Remounted for a new framing, or when reduced motion is known: the
          engine's leftovers never mix with the new set */}
      <HeroStage key={`${framing}-${reducedMotion}`} framing={framing} />
    </div>
  )
}
