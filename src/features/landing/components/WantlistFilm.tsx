import type * as React from 'react'

import { FulfilledWantPromptView } from '#/features/wantlist/components/FulfilledWantPrompt'
import { RecordHeading } from '#/shared/components/RecordHeading'
import { RecordList, RecordRow } from '#/shared/components/RecordList'
import { ReleaseListButtons } from '#/shared/components/ReleaseListButtons'

import { GeneratedCover } from './GeneratedCover'
import { useFilmPlayer } from '../hooks/use-film-player'
import {
  LANDING_RECORDS,
  catalogueLines,
  heroTint,
  landingPressing,
} from '../content/landing.content'
import { lookStyle } from '../film/film-css.utils'
import { NO_BEATS } from '../film/film.model'
import type { Shot } from '../film/film.model'
import { WANTLIST_DEPTH, WANTLIST_SCORE } from '../wantlist.score'
import type { WantlistTrack } from '../wantlist.score'

// The want, and the two wants above it on the list, by LANDING_RECORDS index
const WANT = 4
const OTHERS = [1, 7] as const
const WANT_TINT = heroTint(30)

const castOf = (index: number) => ({
  record: LANDING_RECORDS[index],
  seed: landingPressing(index).id,
})

const NOOP = () => {}

type Looks = Shot<WantlistTrack>

interface TrackedProps {
  name: WantlistTrack
  looks: Looks
  // A track moving descendants of a shared component (see useFilmPlayer)
  target?: string
  className?: string
  style?: React.CSSProperties
  children?: React.ReactNode
}

// One element the film moves, resting at its look until Motion takes over
const Tracked = ({
  name,
  looks,
  target,
  className,
  style,
  children,
}: TrackedProps) => (
  <div
    data-track={name}
    data-track-target={target}
    className={className}
    style={target ? style : { ...style, ...lookStyle(looks[name] ?? {}) }}
  >
    {children}
  </div>
)

interface WantRowProps {
  index: number
}

const WantRow = ({ index }: WantRowProps) => {
  const { record, seed } = castOf(index)
  return (
    <RecordRow
      media={
        <GeneratedCover
          artist={record.artist}
          title={record.title}
          seed={seed}
          className="size-12 shrink-0"
        />
      }
      artist={record.artist}
      title={record.title}
      meta={record.year}
      onClick={NOOP}
    />
  )
}

// The Wantlist section's loop: a want on the Wantlist, its exact release
// added on the Record screen (Owned), the offer to take it off the
// Wantlist, Remove, and the want folding away. A CSS 3D set under one lens,
// built from the app's own pieces; decorative and inert; plays only in
// view, and holds the offer as a still with reduced motion.
export const WantlistFilm = () => {
  const { stageRef, at } = useFilmPlayer(WANTLIST_SCORE, NO_BEATS)
  const looks = WANTLIST_SCORE.sample(at)
  const want = castOf(WANT)

  return (
    <div
      ref={stageRef}
      data-slot="wantlist-film"
      inert
      aria-hidden
      className="@container relative aspect-4/5 w-full min-w-0 overflow-hidden select-none mask-[linear-gradient(transparent,#000_7%,#000_93%,transparent),linear-gradient(90deg,transparent,#000_7%,#000_93%,transparent)] mask-intersect"
    >
      <Tracked
        name="exposure"
        looks={looks}
        className="absolute inset-0 perspective-[120cqw] perspective-origin-[50%_42%]"
      >
        <Tracked
          name="camera"
          looks={looks}
          className="absolute inset-0 origin-[50cqw_50cqw] transform-3d"
        >
          {/* Far back: the Wantlist */}
          <div
            className="absolute inset-0 transform-3d"
            style={{ transform: `translateZ(-${WANTLIST_DEPTH}cqw)` }}
          >
            <Tracked
              name="wantlist"
              looks={looks}
              className="absolute inset-x-[12cqw] top-[34cqw] flex flex-col gap-[3cqw]"
            >
              <div className="flex items-baseline justify-between">
                <p className="type-display text-[8cqw] text-foreground">
                  Wantlist
                </p>
                <p className="relative type-catalogue text-[11px] text-muted-foreground">
                  <Tracked name="count:3" looks={looks}>
                    3 records
                  </Tracked>
                  <Tracked
                    name="count:2"
                    looks={looks}
                    className="absolute inset-0"
                  >
                    2 records
                  </Tracked>
                </p>
              </div>
              <RecordList className="bg-background">
                {OTHERS.map((index) => (
                  <li
                    key={index}
                    data-track="others"
                    style={lookStyle(looks.others ?? {})}
                  >
                    <WantRow index={index} />
                  </li>
                ))}
                <li
                  data-track="want"
                  className="origin-top bg-background"
                  style={lookStyle(looks.want ?? {})}
                >
                  <WantRow index={WANT} />
                </li>
              </RecordList>
            </Tracked>
          </div>

          {/* Near: the want's Record screen */}
          <Tracked
            name="screen"
            looks={looks}
            className="absolute inset-x-[5cqw] top-[5cqw] flex flex-col items-center gap-[3cqw]"
            style={{ '--cover-tint': WANT_TINT }}
          >
            {/* The screen's ground: the page, lit by the Cover's tint, fading
                out before the stage's edges so the Wantlist shows round it */}
            <div className="absolute inset-x-[-5cqw] top-[-6cqw] bottom-[-4cqw] bg-[radial-gradient(closest-side_at_50%_40%,oklch(from_var(--cover-tint)_var(--cover-glow-lightness)_c_h/var(--cover-glow-alpha)),color-mix(in_oklab,var(--background)_70%,transparent)_45%,transparent_80%)]" />
            <div className="relative w-[36cqw] overflow-hidden rounded-(--radius) shadow-[0_10px_30px_var(--pull-shadow)]">
              <GeneratedCover
                artist={want.record.artist}
                title={want.record.title}
                seed={want.seed}
                className="w-full"
              />
              <Tracked
                name="sheen"
                looks={looks}
                className="absolute inset-y-[-30%] left-[30%] w-[40%] bg-[linear-gradient(90deg,transparent,oklch(1_0_0/0.28),transparent)] mix-blend-screen"
              />
            </div>
            {/* The exact release: format, label and catalogue number (the
                year left out, so the screen fits a phone's column) */}
            <Tracked name="heading" looks={looks}>
              <RecordHeading
                artist={want.record.artist}
                title={want.record.title}
                catalogue={catalogueLines(want.record).slice(1)}
              />
            </Tracked>
            <div className="relative">
              <Tracked name="unowned" looks={looks}>
                <Tracked name="press" looks={looks} target="button:first-child">
                  <ReleaseListButtons inCollection={false} inWantlist />
                </Tracked>
              </Tracked>
              <Tracked name="owned" looks={looks} className="absolute inset-0">
                <ReleaseListButtons inCollection inWantlist />
              </Tracked>
            </div>
            <Tracked
              name="prompt"
              looks={looks}
              className="w-full max-w-xs border-t border-border pt-[3cqw]"
            >
              <Tracked name="remove" looks={looks} target="button:last-child">
                <FulfilledWantPromptView onRemove={NOOP} onKeep={NOOP} />
              </Tracked>
            </Tracked>
          </Tracked>
        </Tracked>
      </Tracked>
    </div>
  )
}
