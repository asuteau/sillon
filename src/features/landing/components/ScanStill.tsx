import { RecordList } from '#/shared/components/RecordList'

import { landingRecords } from '../landing.content'
import { LandingStill } from './LandingStill'
import { ScanViewfinder } from './ScanViewfinder'
import { StillRow } from './StillRow'

const [RECORD] = landingRecords(6)

// The scanner's viewfinder over a sleeve's barcode, then the match
export const ScanStill = () => (
  <LandingStill className="flex flex-col gap-5">
    <ScanViewfinder className="aspect-4/3" />

    <div>
      <p className="type-caps mb-2 text-[11px] text-muted-foreground">
        Found on Discogs
      </p>
      <RecordList>
        <li>
          <StillRow record={RECORD} meta={String(RECORD.year)} />
        </li>
      </RecordList>
    </div>
  </LandingStill>
)
