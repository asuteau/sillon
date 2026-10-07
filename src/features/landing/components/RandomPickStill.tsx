import { RandomPickIcon } from '#/shared/components/icons/RandomPickIcon'
import { HouseSleeve } from '#/shared/components/HouseSleeve'
import { RecordHeading } from '#/shared/components/RecordHeading'
import { Button } from '#/shared/components/ui/button'

import { catalogueLines, landingRecords } from '../landing.content'
import { LandingStill } from './LandingStill'

const [RECORD] = landingRecords(1)

// The Random pick spotlight, as it opens from the Collection
export const RandomPickStill = () => (
  <LandingStill className="flex flex-col items-center gap-5">
    <HouseSleeve
      artist={RECORD.artist}
      title={RECORD.title}
      className="w-full max-w-64"
    />
    <RecordHeading
      artist={RECORD.artist}
      title={RECORD.title}
      catalogue={[
        `${RECORD.year} · ${RECORD.added}`,
        ...catalogueLines(RECORD).slice(1),
      ]}
    />
    <Button variant="lacquer">
      <RandomPickIcon />
      Pick again
    </Button>
  </LandingStill>
)
