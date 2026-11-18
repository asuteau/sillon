import type * as React from 'react'

import { DiscRow } from '#/features/collection/components/DiscRow'
import { SleevePullCaption } from '#/features/collection/components/SleevePull'
import { Disc } from '#/shared/components/brand/Disc'
import { GrooveMark } from '#/shared/components/brand/GrooveMark'
import { Wordmark } from '#/shared/components/brand/Wordmark'
import { CoverGlow } from '#/shared/components/CoverGlow'
import { RandomPickIcon } from '#/shared/components/icons/RandomPickIcon'
import { RecordHeading } from '#/shared/components/RecordHeading'
import { Button } from '#/shared/components/ui/button'

import { GeneratedCover } from './GeneratedCover'
import { useFilmPlayer } from '../hooks/use-film-player'
import {
  HERO_CAST,
  LANDING_RECORDS,
  catalogueLines,
  heroTint,
  landingPressing,
  pressingSurface,
} from '../content/landing.content'
import { lookStyle } from '../film/film-css.utils'
import type { Shot } from '../film/film.model'
import {
  HERO_BEATS,
  HERO_CAST_SIZE,
  HERO_SCORE,
  HERO_SLOTS,
  HERO_STAGE_VARS,
  heroCast,
} from '../hero.score'
import type { HeroFilmTrack, HeroSlot, HeroTrackName } from '../hero.score'

// The cast as the app would read it: Vinyl colour from the Discogs formats,
// the Cover tint, the Record screen's catalogue lines
const CAST = HERO_CAST.map(({ index, tintHue }) => {
  const record = LANDING_RECORDS[index]
  const pressing = landingPressing(index)
  return {
    record,
    pressing,
    tint: heroTint(tintHue),
    surface: pressingSurface(pressing),
    catalogue: catalogueLines(record, { withAdded: true }),
  }
})

type CastMember = (typeof CAST)[number]

// Every tracked element's look while it rests: before Motion takes over, or
// for good as the reduced-motion still
type Looks = Shot<HeroFilmTrack>

interface TrackedProps {
  name: HeroTrackName
  looks: Looks
  className?: string
  style?: React.CSSProperties
  children?: React.ReactNode
}

// One element the film moves (`data-track`, see useFilmPlayer)
const Tracked = ({ name, looks, className, style, children }: TrackedProps) => (
  <div
    data-track={name}
    className={className}
    style={{ ...style, ...lookStyle(looks[name] ?? {}) }}
  >
    {children}
  </div>
)

interface SlideProps {
  slot: HeroSlot
  member: CastMember
  looks: Looks
}

// One slide of the strip: a generated Cover, and for the centred and next
// slides, the disc that pulls out of it in its Vinyl colour
const Slide = ({ slot, member, looks }: SlideProps) => {
  const { record, pressing, surface, tint } = member
  const sleeve = (
    <GeneratedCover
      artist={record.artist}
      title={record.title}
      seed={pressing.id}
      className="size-full rounded-(--radius)"
    />
  )

  return (
    <Tracked
      name={`slide:${slot}`}
      looks={looks}
      className="hero-film-slide"
      style={{ '--cover-tint': tint }}
    >
      {slot === 0 || slot === 1 ? (
        <>
          <Tracked
            name={`disc:${slot}`}
            looks={looks}
            className="hero-film-disc absolute inset-[3%]"
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
          <Tracked
            name={`sleeve:${slot}`}
            looks={looks}
            className="hero-film-sleeve absolute inset-0"
          >
            {sleeve}
          </Tracked>
        </>
      ) : (
        <div className="hero-film-sleeve absolute inset-0">{sleeve}</div>
      )}
    </Tracked>
  )
}

interface CaptionProps {
  slot: 0 | 1
  pass: number
  looks: Looks
}

const Caption = ({ slot, pass, looks }: CaptionProps) => {
  const cast = heroCast(pass, slot)
  const { record } = CAST[cast]
  return (
    <Tracked
      name={`caption:${slot}`}
      looks={looks}
      className="absolute inset-x-[6cqw] top-[66cqw] flex"
    >
      <SleevePullCaption
        artist={record.artist}
        title={record.title}
        index={cast}
        count={HERO_CAST_SIZE}
        added={record.added}
      />
    </Tracked>
  )
}

// The landing hero, Pull: the groove draws in and becomes a disc, its House
// sleeve slides in, the disc pulls out (the Sleeve pull); then the strip
// advances, record after record, each Cover growing into its Record screen.
// Built from the app's own pieces; decorative and inert; pauses off-screen or
// in a hidden tab, and holds one still frame with reduced motion.
export const HeroAnimation = () => {
  const { stageRef, scene, at, isPlaying } = useFilmPlayer(
    HERO_SCORE,
    HERO_BEATS,
  )
  const looks = HERO_SCORE.sample(at)
  const onScreen = CAST[heroCast(scene.screen, 0)]

  return (
    <div
      ref={stageRef}
      data-slot="hero-animation"
      data-paused={isPlaying ? undefined : ''}
      inert
      aria-hidden
      className="hero-film @container relative aspect-4/5 w-full min-w-0 overflow-hidden select-none"
      style={HERO_STAGE_VARS}
    >
      <Tracked name="groove" looks={looks} className="hero-film-mark">
        <Tracked
          name="grooveDraw"
          looks={looks}
          className="hero-film-groove size-full"
        >
          <GrooveMark size={160} tone="lacquer" className="size-full" />
        </Tracked>
      </Tracked>
      <Tracked
        name="wordmark"
        looks={looks}
        className="absolute inset-x-0 top-[84cqw] text-center text-foreground"
      >
        <Wordmark className="text-[11cqw]" />
      </Tracked>

      <Tracked
        name="world"
        looks={looks}
        className="hero-film-world absolute inset-0"
      >
        {HERO_SLOTS.map((slot) => (
          <Slide
            key={slot}
            slot={slot}
            member={CAST[heroCast(scene.pass, slot)]}
            looks={looks}
          />
        ))}
      </Tracked>

      <Caption slot={0} pass={scene.pass} looks={looks} />
      <Caption slot={1} pass={scene.pass} looks={looks} />
      <Tracked
        name="pick"
        looks={looks}
        className="absolute inset-x-0 top-[92cqw] flex justify-center"
      >
        <Button variant="lacquer" size="lg">
          <RandomPickIcon />
          Pick for me
        </Button>
      </Tracked>

      {/* The Record screen; its Cover is the flying one, above */}
      <Tracked
        name="screen"
        looks={looks}
        className="absolute inset-0 bg-background"
        style={{ '--cover-tint': onScreen.tint }}
      >
        <CoverGlow tint={onScreen.tint} />
        <div className="absolute inset-x-[6cqw] top-[55cqw] flex flex-col items-center gap-[4cqw]">
          <Tracked name="screenHeading" looks={looks}>
            <RecordHeading
              artist={onScreen.record.artist}
              title={onScreen.record.title}
              catalogue={onScreen.catalogue}
            />
          </Tracked>
          <Tracked name="screenDiscs" looks={looks}>
            <DiscRow
              releaseId={onScreen.pressing.id}
              formats={onScreen.pressing.formats}
              picture={null}
            />
          </Tracked>
        </div>
      </Tracked>
      <Tracked
        name="flyer"
        looks={looks}
        className="hero-film-flyer hero-film-sleeve"
      >
        <GeneratedCover
          artist={onScreen.record.artist}
          title={onScreen.record.title}
          seed={onScreen.pressing.id}
          className="size-full rounded-(--radius)"
        />
      </Tracked>
    </div>
  )
}
