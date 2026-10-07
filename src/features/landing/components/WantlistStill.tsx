import { RecordHeading } from '#/shared/components/RecordHeading'
import { HouseSleeve } from '#/shared/components/HouseSleeve'
import { FulfilledWantPromptView } from '#/features/wantlist/components/FulfilledWantPrompt'

import { catalogueLines, landingRecords } from '../landing.content'
import { LandingStill } from './LandingStill'

const [RECORD] = landingRecords(5)

// The record screen right after adding a Release that was on the Wantlist
export const WantlistStill = () => (
  <LandingStill className="flex flex-col items-center gap-5">
    <HouseSleeve
      artist={RECORD.artist}
      title={RECORD.title}
      className="w-full max-w-56"
    />
    <RecordHeading
      artist={RECORD.artist}
      title={RECORD.title}
      catalogue={catalogueLines(RECORD)}
    />
    <div className="w-full max-w-xs border-t border-border pt-5">
      <FulfilledWantPromptView onRemove={() => {}} onKeep={() => {}} />
    </div>
  </LandingStill>
)
