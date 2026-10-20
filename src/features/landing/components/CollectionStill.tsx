import {
  SleevePullBody,
  SleevePullCaption,
} from '#/features/collection/components/SleevePull'
import { Disc } from '#/shared/components/brand/Disc'
import { HouseSleeve } from '#/shared/components/HouseSleeve'
import { Button } from '#/shared/components/ui/button'
import { ArrowLeft, ArrowRight } from 'lucide-react'

import {
  landingPressing,
  landingRecords,
  pressingSurface,
} from '../content/landing.content'
import { LandingStill } from './LandingStill'

// Recent additions as the strip shows them: five records, the second centred
const COUNT = 5
const CENTRED = 1
const RECORDS = landingRecords(0, 1, 2, 3, 4)
// The centred record and a neighbour either side
const SLOTS = [CENTRED - 1, CENTRED, CENTRED + 1]

const centred = RECORDS[CENTRED]
const surface = pressingSurface(landingPressing(CENTRED))

// The Sleeve pull, held in its settled pose: the centred sleeve and its disc
// parted, the neighbours scaled down and dimmed (design system §5)
export const CollectionStill = () => (
  <LandingStill className="@container">
    <div className="sleeve-pull-strip -mx-4 sm:-mx-6">
      {SLOTS.map((index) => {
        const record = RECORDS[index]
        const isCentred = index === CENTRED
        return (
          <span
            key={record.title}
            className="sleeve-pull-slide"
            style={{ '--pull-distance': isCentred ? 0 : 1 }}
          >
            <SleevePullBody
              // Neighbours' discs stay tucked, out of sight
              disc={
                isCentred && (
                  <Disc
                    surface={surface.background}
                    seeThrough={surface.seeThrough}
                  />
                )
              }
              sleeve={
                <HouseSleeve
                  artist={record.artist}
                  title={record.title}
                  className="size-full overflow-hidden rounded-(--radius)"
                />
              }
            />
          </span>
        )
      })}
    </div>

    <div className="flex items-center gap-4">
      <Button
        variant="outline"
        size="icon-lg"
        className="hidden sm:inline-flex"
        aria-label="Previous record"
      >
        <ArrowLeft />
      </Button>
      <SleevePullCaption
        artist={centred.artist}
        title={centred.title}
        index={CENTRED}
        count={COUNT}
        added={centred.added}
      />
      <Button
        variant="outline"
        size="icon-lg"
        className="hidden sm:inline-flex"
        aria-label="Next record"
      >
        <ArrowRight />
      </Button>
    </div>
  </LandingStill>
)
