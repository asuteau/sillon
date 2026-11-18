import { DiscRow } from '#/features/collection/components/DiscRow'
import { SleevePullCaption } from '#/features/collection/components/SleevePull'
import { Disc } from '#/shared/components/brand/Disc'
import { CoverGlow } from '#/shared/components/CoverGlow'
import { RecordHeading } from '#/shared/components/RecordHeading'

import {
  COLLECTION_BEATS,
  COLLECTION_SCORE,
  COLLECTION_SLOTS,
  COLLECTION_SOFT_BLUR,
  COLLECTION_STAGE_VARS,
} from '../collection.score'
import type { CollectionScene, CollectionTrack } from '../collection.score'
import {
  LANDING_RECORDS,
  catalogueLines,
  heroTint,
  landingPressing,
  pressingSurface,
} from '../content/landing.content'
import { FilmStage } from '../film/FilmStage'
import type { Shot } from '../film/film.model'
import { SoftTwin } from '../film/SoftTwin'
import { Tracked } from '../film/Tracked'
import { GeneratedCover } from './GeneratedCover'

// The records taking turns at the strip's centre, by LANDING_RECORDS index,
// each in a different Vinyl colour; the second, first on the Record screen,
// with two discs. The hue is the tint its Cover would give
const CAST = [
  { index: 1, tintHue: 190 },
  { index: 5, tintHue: 150 },
  { index: 8, tintHue: 75 },
  { index: 3, tintHue: 20 },
].map(({ index, tintHue }) => {
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

const castAt = (turn: number): CastMember =>
  CAST[((turn % CAST.length) + CAST.length) % CAST.length]

interface CoverProps {
  member: CastMember
}

const Cover = ({ member: { record, pressing } }: CoverProps) => (
  <GeneratedCover
    artist={record.artist}
    title={record.title}
    seed={pressing.id}
    className="size-full"
  />
)

interface SlideProps {
  slot: (typeof COLLECTION_SLOTS)[number]
  member: CastMember
  looks: Shot<CollectionTrack>
}

// What a slide shows: a generated Cover and, for the two slides that come
// to the centre, the disc that pulls out of it in its Vinyl colour
const SlideBody = ({ slot, member, looks }: SlideProps) => {
  if (slot !== 0 && slot !== 1)
    return (
      <div className="collection-loop-sleeve absolute inset-0">
        <Cover member={member} />
      </div>
    )

  return (
    <>
      <Tracked
        name={`disc:${slot}`}
        looks={looks}
        className="collection-loop-disc absolute inset-[3%]"
      >
        {/* The grooves turn (`spin`); the sheen stays with the light */}
        <span
          data-track="spin"
          data-track-target=".disc-grooves"
          className="absolute inset-0"
        >
          <Disc
            surface={member.surface.background}
            seeThrough={member.surface.seeThrough}
          />
        </span>
      </Tracked>
      <Tracked
        name={`sleeve:${slot}`}
        looks={looks}
        className="collection-loop-sleeve absolute inset-0"
      >
        <Cover member={member} />
      </Tracked>
    </>
  )
}

// One slide of the strip, out of focus (its soft twin) off the centre
const Slide = ({ slot, member, looks }: SlideProps) => (
  <Tracked
    name={`slide:${slot}`}
    looks={looks}
    className="collection-loop-slide"
  >
    <SoftTwin
      sharp={`slide:${slot}:sharp`}
      soft={`slide:${slot}:soft`}
      looks={looks}
      blur={COLLECTION_SOFT_BLUR}
      className="absolute inset-0"
    >
      <SlideBody slot={slot} member={member} looks={looks} />
    </SoftTwin>
  </Tracked>
)

interface CaptionProps {
  slot: 0 | 1
  turn: number
  looks: Shot<CollectionTrack>
}

const Caption = ({ slot, turn, looks }: CaptionProps) => {
  const { record } = castAt(turn)
  return (
    <Tracked
      name={`caption:${slot}`}
      looks={looks}
      className="absolute inset-x-[6cqw] top-[86cqw] flex"
    >
      <SleevePullCaption
        artist={record.artist}
        title={record.title}
        index={((turn % CAST.length) + CAST.length) % CAST.length}
        count={CAST.length}
        added={record.added}
      />
    </Tracked>
  )
}

// The Collection section's loop: Recent additions as the Sleeve pull, seen
// through a camera that swings with the strip; the next record pulls out and
// its Cover grows into its Record screen, then lands back on its sleeve.
// Built from the app's own pieces; frameless, decorative and inert; plays only on
// screen, and holds the Sleeve pull still with reduced motion.
export const CollectionLoop = () => (
  <FilmStage
    score={COLLECTION_SCORE}
    beats={COLLECTION_BEATS}
    slot="collection-film"
    className="collection-loop aspect-4/5 w-full min-w-0 overflow-hidden"
    style={COLLECTION_STAGE_VARS}
  >
    {({ looks, scene }) => <CollectionSet looks={looks} scene={scene} />}
  </FilmStage>
)

interface CollectionSetProps {
  looks: Shot<CollectionTrack>
  scene: CollectionScene
}

const CollectionSet = ({ looks, scene }: CollectionSetProps) => {
  const onScreen = castAt(scene.screen)

  return (
    <>
      {/* The strip's edges fade into the page; the camera moves inside */}
      <div className="collection-loop-strip absolute inset-0">
        <Tracked
          name="camera"
          looks={looks}
          className="collection-loop-camera absolute inset-0"
        >
          {COLLECTION_SLOTS.map((slot) => (
            <Slide
              key={slot}
              slot={slot}
              member={castAt(scene.pass + slot)}
              looks={looks}
            />
          ))}
        </Tracked>
      </div>

      <Caption slot={0} turn={scene.pass} looks={looks} />
      <Caption slot={1} turn={scene.pass + 1} looks={looks} />

      {/* The Record screen; its Cover is the flying one, above */}
      <Tracked
        name="screen"
        looks={looks}
        className="absolute inset-0 bg-background"
        style={{ '--cover-tint': onScreen.tint }}
      >
        <CoverGlow tint={onScreen.tint} />
        <div className="absolute inset-x-[6cqw] top-[64cqw] flex flex-col items-center gap-[4cqw]">
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
        className="collection-loop-flyer collection-loop-sleeve"
      >
        <Cover member={onScreen} />
        {/* Light crossing the Cover as it lands */}
        <Tracked
          name="glint"
          looks={looks}
          className="collection-loop-glint absolute inset-y-0 left-[20%] w-[60%]"
        />
      </Tracked>
    </>
  )
}
