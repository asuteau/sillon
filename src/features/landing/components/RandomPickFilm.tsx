import type * as React from 'react'

import { Disc } from '#/shared/components/brand/Disc'
import { RandomPickIcon } from '#/shared/components/icons/RandomPickIcon'
import { RecordHeading } from '#/shared/components/RecordHeading'
import { Button } from '#/shared/components/ui/button'

import { GeneratedCover } from './GeneratedCover'
import { useFilmPlayer } from '../hooks/use-film-player'
import {
  LANDING_RECORDS,
  catalogueLines,
  heroTint,
  landingPressing,
  pressingSurface,
} from '../content/landing.content'
import { lookStyle } from '../film/film-css.utils'
import { NO_BEATS } from '../film/film.model'
import type { Shot } from '../film/film.model'
import {
  CRATE,
  PICKS,
  RANDOM_PICK_SCORE,
  SLOTS,
  slotZ,
} from '../random-pick.score'
import type { PickName, RandomPickTrack } from '../random-pick.score'

// The crate, front to back, by LANDING_RECORDS index; the two picks get a
// Cover tint (House sleeves give none) for their disc's label
const CRATE_RECORDS = [8, 0, 1, 7, 3, 5, 6] as const
const PICK_TINT_HUE: Record<PickName, number> = { a: 190, b: 30 }

const crateRecord = (slot: number) => {
  const index = CRATE_RECORDS[slot]
  const record = LANDING_RECORDS[index]
  const pressing = landingPressing(index)
  return {
    record,
    pressing,
    surface: pressingSurface(pressing),
    catalogue: catalogueLines(record, { withAdded: true }),
  }
}

type Looks = Shot<RandomPickTrack>

const cqw = (n: number) => `${n}cqw`

interface TrackedProps {
  name: RandomPickTrack
  looks: Looks
  className?: string
  style?: React.CSSProperties
  children?: React.ReactNode
}

// One element the film moves (`data-track`, see useFilmPlayer), resting at
// its look until Motion takes over
const Tracked = ({ name, looks, className, style, children }: TrackedProps) => (
  <div
    data-track={name}
    className={className}
    style={{ ...style, ...lookStyle(looks[name] ?? {}) }}
  >
    {children}
  </div>
)

// The page's ground over the crate while a record is out: it falls back
// into the haze
const Haze = ({ name, looks }: { name: RandomPickTrack; looks: Looks }) => (
  <Tracked
    name={name}
    looks={looks}
    className="pointer-events-none absolute inset-0 bg-background"
  />
)

const { sleeve: SLEEVE, wall: WALL, margin: MARGIN } = CRATE
const CRATE_WIDTH = SLEEVE + 2 * MARGIN
const FRONT_Z = MARGIN
const BACK_Z = slotZ(CRATE.slots - 1) - MARGIN
const CRATE_DEPTH = FRONT_Z - BACK_Z
const MID_Z = (FRONT_Z + BACK_Z) / 2

interface PanelProps {
  width: number
  height: number
  transform: string
  className: string
  looks: Looks
}

// A flat panel of the crate, centred on the world's origin then placed
const Panel = ({ width, height, transform, className, looks }: PanelProps) => (
  <div
    className={`absolute overflow-hidden ${className}`}
    style={{
      left: cqw(-width / 2),
      top: cqw(-height / 2),
      width: cqw(width),
      height: cqw(height),
      transform,
    }}
  >
    <Haze name="haze" looks={looks} />
  </div>
)

// The crate's floor and walls, round the records; the front wall is low so
// the Covers show over it
const Crate = ({ looks }: { looks: Looks }) => (
  <>
    {/* Its contact shadow, on the floor it stands on */}
    <div
      className="absolute rounded-[50%]"
      style={{
        left: cqw(-CRATE_WIDTH * 0.75),
        top: cqw(-CRATE_DEPTH * 0.75),
        width: cqw(CRATE_WIDTH * 1.5),
        height: cqw(CRATE_DEPTH * 1.5),
        transform: `translate3d(0, 0.2cqw, ${cqw(MID_Z)}) rotateX(90deg)`,
        background:
          'radial-gradient(closest-side, var(--pull-shadow), transparent)',
      }}
    />
    <Panel
      looks={looks}
      width={CRATE_WIDTH}
      height={CRATE_DEPTH}
      transform={`translate3d(0, 0, ${cqw(MID_Z)}) rotateX(90deg)`}
      className="bg-muted"
    />
    <Panel
      looks={looks}
      width={CRATE_WIDTH}
      height={WALL * 1.6}
      transform={`translate3d(0, ${cqw(-WALL * 0.8)}, ${cqw(BACK_Z)})`}
      className="bg-secondary"
    />
    {[-1, 1].map((side) => (
      <Panel
        key={side}
        looks={looks}
        width={CRATE_DEPTH}
        height={WALL}
        transform={`translate3d(${cqw((side * CRATE_WIDTH) / 2)}, ${cqw(-WALL / 2)}, ${cqw(MID_Z)}) rotateY(90deg)`}
        className="bg-secondary"
      />
    ))}
    <Panel
      looks={looks}
      width={CRATE_WIDTH}
      height={WALL}
      transform={`translate3d(0, ${cqw(-WALL / 2)}, ${cqw(FRONT_Z)})`}
      className="border-t border-border bg-card shadow-[inset_0_1px_0_oklch(1_0_0/0.25)]"
    />
  </>
)

interface SleeveProps {
  slot: number
  looks: Looks
}

// A record standing in the crate, hinged at its foot; a pick carries its
// disc behind the Cover, to slide out once it faces the camera
const Sleeve = ({ slot, looks }: SleeveProps) => {
  const { record, pressing, surface } = crateRecord(slot)
  const pick = (['a', 'b'] as const).find((name) => PICKS[name].slot === slot)
  return (
    <Tracked
      name={`sleeve:${slot}`}
      looks={looks}
      className="absolute origin-bottom transform-3d"
      style={{
        left: cqw(-SLEEVE / 2),
        top: cqw(-SLEEVE),
        width: cqw(SLEEVE),
        height: cqw(SLEEVE),
        ...(pick && { '--cover-tint': heroTint(PICK_TINT_HUE[pick]) }),
      }}
    >
      {pick && (
        <Tracked
          name={`disc:${pick}`}
          looks={looks}
          className="absolute inset-[3%] [&_.disc]:inset-0"
        >
          {/* The grooves turn (`spin`); the sheen stays with the light */}
          <span
            data-track="spin"
            data-track-target=".disc-grooves"
            className="absolute inset-0"
          >
            <Disc
              surface={surface.background}
              seeThrough={surface.seeThrough}
            />
          </span>
        </Tracked>
      )}
      <div className="absolute inset-0 overflow-hidden rounded-(--radius) shadow-[0_0.6cqw_2cqw_var(--pull-shadow),inset_0_1px_0_oklch(1_0_0/0.3)]">
        <GeneratedCover
          artist={record.artist}
          title={record.title}
          seed={pressing.id}
          className="size-full rounded-none"
        />
        {pick && (
          <Tracked
            name={`gloss:${pick}`}
            looks={looks}
            className="pointer-events-none absolute inset-y-0 left-0 w-full mix-blend-plus-lighter"
            style={{
              background:
                'linear-gradient(100deg, transparent 30%, oklch(1 0 0 / 0.1) 42%, oklch(1 0 0 / 0.38) 50%, oklch(1 0 0 / 0.1) 58%, transparent 70%)',
            }}
          />
        )}
        <Haze name={pick ? `haze:${pick}` : 'haze'} looks={looks} />
      </div>
    </Tracked>
  )
}

interface CaptionProps {
  pick: PickName
  looks: Looks
}

// The drawn record's heading, as on its Record screen
const Caption = ({ pick, looks }: CaptionProps) => {
  const { record, catalogue } = crateRecord(PICKS[pick].slot)
  return (
    <Tracked
      name={`caption:${pick}`}
      looks={looks}
      className="absolute inset-x-[6cqw] top-[80cqw] flex justify-center"
    >
      <RecordHeading
        artist={record.artist}
        title={record.title}
        catalogue={catalogue.slice(0, 1)}
      />
    </Tracked>
  )
}

const PICK_BUTTONS = [
  ['pickFor', 'Pick for me'],
  ['pickAgain', 'Pick again'],
] as const

// The Random pick section's loop: a crate of records under a camera; "Pick
// for me" flicks through it and draws one out, its disc sliding out in its
// Vinyl colour; "Pick again" draws the next. Landing only: the app's own
// Random pick stays a plain fade. Built from the app's own pieces;
// decorative and inert; plays only on screen, a still with reduced motion.
export const RandomPickFilm = () => {
  const { stageRef, at } = useFilmPlayer(RANDOM_PICK_SCORE, NO_BEATS)
  const looks = RANDOM_PICK_SCORE.sample(at)

  return (
    <div
      ref={stageRef}
      data-slot="random-pick-film"
      inert
      aria-hidden
      className="@container relative aspect-4/5 w-full min-w-0 overflow-hidden select-none"
    >
      <div className="absolute inset-0 perspective-[160cqw] perspective-origin-[50%_45%]">
        <Tracked
          name="world"
          looks={looks}
          className="absolute top-[78cqw] left-1/2 size-0 transform-3d"
        >
          <Crate looks={looks} />
          {/* Back to front, so each Cover shows over the one behind */}
          {[...SLOTS].reverse().map((slot) => (
            <Sleeve key={slot} slot={slot} looks={looks} />
          ))}
        </Tracked>
      </div>

      <Caption pick="a" looks={looks} />
      <Caption pick="b" looks={looks} />
      {PICK_BUTTONS.map(([name, label]) => (
        <Tracked
          key={name}
          name={name}
          looks={looks}
          className="absolute inset-x-0 bottom-[7cqw] flex justify-center"
        >
          <Button variant="lacquer" size="lg">
            <RandomPickIcon />
            {label}
          </Button>
        </Tracked>
      ))}
    </div>
  )
}
