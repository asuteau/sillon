import type * as React from 'react'

import { PortraitFigures } from '#/features/portrait/components/PortraitFigures'
import { RankedList } from '#/features/portrait/components/RankedList'
import { TimeChart } from '#/features/portrait/components/TimeChart'
import { formatEstimatedValue } from '#/features/portrait/portrait.utils'
import { usePrefersReducedMotion } from '#/shared/hooks/use-prefers-reduced-motion'
import { formatPressingDecade } from '#/shared/utils/list-filter'

import { LANDING_PORTRAIT } from '../content/landing.content'
import { lookStyle } from '../film/film-css.utils'
import { NO_BEATS } from '../film/film.model'
import type { Shot } from '../film/film.model'
import { useFilmPlayer } from '../hooks/use-film-player'
import { PORTRAIT_SCORE } from '../portrait.score'
import type { PortraitTrack } from '../portrait.score'

const { currency, estimatedValue, topArtists, pressingDecades } =
  LANDING_PORTRAIT

const ESTIMATE = formatEstimatedValue(estimatedValue, currency, 'en-GB')
const RECORD_COUNT = pressingDecades.reduce(
  (sum, { copies }) => sum + copies,
  0,
)

type Looks = Shot<PortraitTrack>

interface TrackedProps {
  name: PortraitTrack
  looks: Looks
  className?: string
  children?: React.ReactNode
}

// One element the film moves (`data-track`, see useFilmPlayer)
const Tracked = ({ name, looks, className, children }: TrackedProps) => (
  <div
    data-track={name}
    className={className}
    style={lookStyle(looks[name] ?? {})}
  >
    {children}
  </div>
)

interface BarTracksProps {
  names: readonly PortraitTrack[]
  // The chart's bar for the nth track
  bar: (index: number) => string
  children: React.ReactNode
}

// The chart's bars, each its own track: they sit inside the chart, so each
// track names its bar (`data-track-target`) from a wrapper around it. React
// can't rest them; src/styles.css does (`.portrait-film`)
const BarTracks = ({ names, bar, children }: BarTracksProps) =>
  names.reduceRight<React.ReactNode>(
    (inner, name, index) => (
      <div
        data-track={name}
        data-track-target={bar(index)}
        className="contents"
      >
        {inner}
      </div>
    ),
    children,
  )

const ARTIST_BARS = topArtists.map((_, i) => `artistBar:${i}` as const)
const DECADE_BARS = pressingDecades.map((_, i) => `decadeBar:${i}` as const)
const DECADE_COUNTS = pressingDecades.map((_, i) => `decadeCount:${i}` as const)

// The Portrait loop: the sheet, at an angle, turns to face the camera as its
// bars draw in and the leaders turn copper, the focus racking down from Top
// artists to Pressing decade. Built from the Portrait's own figures and
// charts; decorative and inert; plays only on screen, and holds one still
// frame with reduced motion.
export const PortraitFilm = () => {
  const { stageRef, at, isPlaying } = useFilmPlayer(PORTRAIT_SCORE, NO_BEATS)
  const looks = PORTRAIT_SCORE.sample(at)
  // Hydrated as if motion were fine, the film may start before reduced
  // motion is known; Motion leaves its styles on the bars as it stops. A
  // fresh sheet for the still drops them.
  const reducedMotion = usePrefersReducedMotion()

  return (
    <div
      ref={stageRef}
      data-slot="portrait-film"
      data-paused={isPlaying ? undefined : ''}
      inert
      aria-hidden
      className="portrait-film @container relative w-full min-w-0 overflow-clip py-[3cqw] select-none"
    >
      <Tracked
        key={reducedMotion ? 'still' : 'film'}
        name="page"
        looks={looks}
        className="portrait-film-page"
      >
        <div className="portrait-film-sheet relative flex min-w-0 flex-col gap-8 overflow-hidden rounded-(--radius) border border-border bg-background p-4 select-none sm:p-6 [&_section]:mt-0">
          <Tracked name="figures" looks={looks}>
            <PortraitFigures
              recordCount={RECORD_COUNT.toLocaleString('en-GB')}
              estimatedValue={ESTIMATE?.median}
              valueRange={ESTIMATE?.range}
            />
          </Tracked>
          <Tracked name="artists" looks={looks}>
            <BarTracks
              names={ARTIST_BARS}
              bar={(i) => `li:nth-child(${i + 1}) .portrait-bar`}
            >
              <RankedList
                title="Top artists"
                entries={topArtists.map(({ name, copies }) => ({
                  key: name,
                  label: name,
                  count: copies,
                }))}
              />
            </BarTracks>
          </Tracked>
          <Tracked name="decades" looks={looks}>
            <BarTracks
              names={DECADE_BARS}
              bar={(i) => `li:nth-child(${i + 1}) .portrait-column`}
            >
              <BarTracks
                names={DECADE_COUNTS}
                bar={(i) =>
                  `li:nth-child(${i + 1}) span:has(+ .portrait-column)`
                }
              >
                <TimeChart
                  title="Pressing decade"
                  entries={pressingDecades.map(({ decade, copies }) => ({
                    key: decade,
                    label: formatPressingDecade(decade),
                    count: copies,
                  }))}
                />
              </BarTracks>
            </BarTracks>
          </Tracked>
          <Tracked
            name="shade"
            looks={looks}
            className="portrait-film-shade pointer-events-none absolute inset-0"
          />
        </div>
      </Tracked>
    </div>
  )
}
