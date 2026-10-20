import type * as React from 'react'

import { DiscRow } from '#/features/collection/components/DiscRow'
import { SleevePullCaption } from '#/features/collection/components/SleevePull'
import { discSurface } from '#/features/collection/disc-surface.utils'
import { slidePosition } from '#/features/collection/sleeve-pull.utils'
import { vinylColour } from '#/features/collection/vinyl-colour.utils'
import { Disc } from '#/shared/components/brand/Disc'
import { GrooveMark } from '#/shared/components/brand/GrooveMark'
import { Wordmark } from '#/shared/components/brand/Wordmark'
import { CoverGlow } from '#/shared/components/CoverGlow'
import { HouseSleeve } from '#/shared/components/HouseSleeve'
import { RandomPickIcon } from '#/shared/components/icons/RandomPickIcon'
import { RecordHeading } from '#/shared/components/RecordHeading'
import { Button } from '#/shared/components/ui/button'

import { useHeroPlayback } from '../hooks/use-hero-playback'
import {
  HERO_CAST,
  LANDING_RECORDS,
  heroTint,
  landingPressing,
} from '../landing.content'
import {
  HERO_CAST_SIZE,
  HERO_SLOTS,
  HERO_TRACKS,
  frameAt,
  heroCast,
  poseTransform,
} from '../landing.timeline'
import type { HeroClock, HeroSlot, HeroTrackName } from '../landing.timeline'

// The cast as the app would read it: Vinyl colour from the Discogs formats,
// the Cover tint, the Record screen's catalogue lines
const CAST = HERO_CAST.map(({ index, tintHue }) => {
  const record = LANDING_RECORDS[index]
  const pressing = landingPressing(index)
  const [format] = pressing.formats
  return {
    record,
    pressing,
    tint: heroTint(tintHue),
    surface: discSurface(vinylColour(pressing.formats), pressing.id),
    catalogue: [
      `${record.year} · ${record.added}`,
      [format.name, ...(format.descriptions ?? []), format.text]
        .filter(Boolean)
        .join(' · '),
      `${record.label} · ${record.catno}`,
    ],
  }
})

type CastMember = (typeof CAST)[number]

// An element's look before its Web Animation takes over, or for good as the
// reduced-motion still
const restingStyle = (
  clock: HeroClock,
  name: HeroTrackName,
): React.CSSProperties => {
  const { opacity, pose, draw } = frameAt(
    HERO_TRACKS[clock.part][name],
    clock.ms,
  )
  return name === 'grooveDraw'
    ? { '--groove-undrawn': 1 - draw }
    : { opacity, transform: poseTransform(pose) }
}

interface TrackedProps {
  name: HeroTrackName
  clock: HeroClock
  className?: string
  style?: React.CSSProperties
  children?: React.ReactNode
}

// One element the film moves (`data-track`, see useHeroPlayback)
const Tracked = ({ name, clock, className, style, children }: TrackedProps) => (
  <div
    data-track={name}
    className={className}
    style={{ ...style, ...restingStyle(clock, name) }}
  >
    {children}
  </div>
)

interface SlideProps {
  slot: HeroSlot
  member: CastMember
  clock: HeroClock
}

// One slide of the strip: a House sleeve, and for the centred and next
// slides, the disc that pulls out of it in its Vinyl colour
const Slide = ({ slot, member, clock }: SlideProps) => {
  const { record, surface, tint } = member
  const sleeve = (
    <HouseSleeve
      artist={record.artist}
      title={record.title}
      className="size-full rounded-(--radius)"
    />
  )

  return (
    <Tracked
      name={`slide:${slot}`}
      clock={clock}
      className="absolute top-[31cqw] left-[25cqw] size-[50cqw]"
      style={{ '--cover-tint': tint }}
    >
      {slot === 0 || slot === 1 ? (
        <>
          <Tracked
            name={`disc:${slot}`}
            clock={clock}
            className="hero-film-disc absolute inset-[3%]"
          >
            <span data-spin className="absolute inset-0">
              <Disc
                surface={surface.background}
                seeThrough={surface.seeThrough}
              />
            </span>
          </Tracked>
          <Tracked
            name={`sleeve:${slot}`}
            clock={clock}
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
  clock: HeroClock
}

const Caption = ({ slot, pass, clock }: CaptionProps) => {
  const cast = heroCast(pass, slot)
  const { record } = CAST[cast]
  return (
    <Tracked
      name={`caption:${slot}`}
      clock={clock}
      className="absolute inset-x-[6cqw] top-[66cqw] flex"
    >
      <SleevePullCaption
        artist={record.artist}
        title={record.title}
        catalogue={`${slidePosition(cast, HERO_CAST_SIZE)} · Added ${record.added}`}
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
  const { stageRef, scene, clock, isPlaying } = useHeroPlayback()
  const onScreen = CAST[heroCast(scene.screen, 0)]

  return (
    <div
      ref={stageRef}
      data-slot="hero-animation"
      data-paused={isPlaying ? undefined : ''}
      inert
      aria-hidden
      className="hero-film @container relative aspect-4/5 w-full min-w-0 overflow-hidden select-none"
    >
      <Tracked
        name="groove"
        clock={clock}
        className="absolute top-[34cqw] left-[28cqw] size-[44cqw]"
      >
        <Tracked
          name="grooveDraw"
          clock={clock}
          className="hero-film-groove size-full"
        >
          <GrooveMark size={160} tone="lacquer" className="size-full" />
        </Tracked>
      </Tracked>
      <Tracked
        name="wordmark"
        clock={clock}
        className="absolute inset-x-0 top-[84cqw] text-center text-foreground"
      >
        <Wordmark className="text-[11cqw]" />
      </Tracked>

      <Tracked
        name="world"
        clock={clock}
        className="hero-film-world absolute inset-0"
      >
        {HERO_SLOTS.map((slot) => (
          <Slide
            key={slot}
            slot={slot}
            member={CAST[heroCast(scene.pass, slot)]}
            clock={clock}
          />
        ))}
      </Tracked>

      <Caption slot={0} pass={scene.pass} clock={clock} />
      <Caption slot={1} pass={scene.pass} clock={clock} />
      <Tracked
        name="pick"
        clock={clock}
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
        clock={clock}
        className="absolute inset-0 bg-background"
        style={{ '--cover-tint': onScreen.tint }}
      >
        <CoverGlow tint={onScreen.tint} />
        <div className="absolute inset-x-[6cqw] top-[55cqw] flex flex-col items-center gap-[4cqw]">
          <Tracked name="screenHeading" clock={clock}>
            <RecordHeading
              artist={onScreen.record.artist}
              title={onScreen.record.title}
              catalogue={onScreen.catalogue}
            />
          </Tracked>
          <Tracked name="screenDiscs" clock={clock}>
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
        clock={clock}
        className="hero-film-sleeve absolute top-[5cqw] left-[27cqw] size-[46cqw]"
      >
        <HouseSleeve
          artist={onScreen.record.artist}
          title={onScreen.record.title}
          className="size-full rounded-(--radius)"
        />
      </Tracked>
    </div>
  )
}
