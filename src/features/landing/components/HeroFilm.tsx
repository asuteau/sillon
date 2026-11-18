import { RotateCcw } from 'lucide-react'

import { LIST_NAMES, plural } from '#/features/scan/components/StackBar'
import { CollectionIcon } from '#/shared/components/icons/CollectionIcon'
import { Button } from '#/shared/components/ui/button'

import { HeroSet } from './HeroSet'
import { FilmStage } from '../film/FilmStage'
import { NO_BEATS, round3 } from '../film/film.model'
import type { Shot } from '../film/film.model'
import { Tracked } from '../film/Tracked'
import { useHeroFraming } from '../hooks/use-hero-framing'
import { LAYOUT } from '../hero/hero-cues.score'
import { HERO_SCORES, HERO_STAGES, softBlur } from '../hero/hero.score'
import type { HeroFraming, HeroTrack } from '../hero/hero.score'

// Frameless: every edge of the stage falls back into the page
const STAGE_MASK =
  'linear-gradient(90deg, transparent, black 10%, black 90%, transparent), linear-gradient(transparent, black 8%, black 88%, transparent)'

interface StackHudProps {
  looks: Shot<HeroTrack>
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

const cqw = (n: number) => `${round3(n)}cqw`

// The frame the film is composed for, 16:9 or 4:5, as tall as the band and
// centred in it: on a band wider than 16:9 (a short screen) the camera
// keeps its framing and more of the set shows either side, never cropped
// top or bottom. The film's units (`cqw`) are the frame's
const FRAME =
  'absolute inset-y-0 left-1/2 aspect-4/5 -translate-x-1/2 md:aspect-video'

interface HeroStageProps {
  framing: HeroFraming
}

// The film on its stage, and Replay once it has ended
const HeroStage = ({ framing }: HeroStageProps) => {
  const { perspective, unit, centre } = HERO_STAGES[framing]

  return (
    // The band, the page's width: the frame's composition, and the set on
    // either side of it where the screen is wider
    <FilmStage
      score={HERO_SCORES[framing]}
      beats={NO_BEATS}
      slot="hero-film"
      className="absolute inset-0 overflow-hidden"
      controls={({ hasEnded, replay }) =>
        hasEnded && (
          <Button
            variant="outline"
            size="sm"
            onClick={replay}
            className="absolute right-4 bottom-3 animate-in bg-background/70 fade-in sm:right-6 sm:bottom-5"
          >
            <RotateCcw />
            Replay
          </Button>
        )
      }
    >
      {({ looks }) => (
        <>
          {/* The page ground inside the mask: the grade blends over it */}
          <div
            className="absolute inset-0 bg-background"
            style={{ maskImage: STAGE_MASK, maskComposite: 'intersect' }}
          >
            <div className={`@container ${FRAME}`}>
              <div
                className="absolute inset-0"
                style={{
                  perspective: cqw(perspective),
                  perspectiveOrigin: `${centre * 100}% 50%`,
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
              </div>
            </div>
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
          <div className={FRAME}>
            <StackHud looks={looks} centre={centre} />
          </div>
        </>
      )}
    </FilmStage>
  )
}

// The landing's hero film (#109): cold Discogs rows flip into HD Covers, a
// Stack of three sleeves is scanned and added in one go, the newest record
// comes out of the wall and its disc slides out in its Vinyl colour; then
// the camera pulls back and holds. Full width, 16:9 or about 4:5 for the
// screen, or as tall as its row lets it from tablet widths up; decorative and inert but for Replay; pauses off-screen and in a
// hidden tab; one still with reduced motion.
export const HeroFilm = () => {
  const framing = useHeroFraming()

  return (
    <div className="relative mx-auto aspect-4/5 w-full max-w-360 md:aspect-auto">
      {/* Its first frame until the screen is known (the server, hydration):
          the page ground the film fades up from. Then the set, built once
          for the screen, and rebuilt for a new framing (another score,
          another set) */}
      {framing === null ? (
        <div
          data-slot="hero-film"
          inert
          aria-hidden
          className="absolute inset-0 bg-background"
        />
      ) : (
        <HeroStage key={framing} framing={framing} />
      )}
    </div>
  )
}
