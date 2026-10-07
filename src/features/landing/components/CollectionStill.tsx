import { RecordList } from '#/shared/components/RecordList'
import { SortChips } from '#/shared/components/SortChips'

import { landingRecords } from '../landing.content'
import { LandingStill } from './LandingStill'
import { StillRow } from './StillRow'

const RECORDS = landingRecords(0, 1, 2, 3, 4)

export const CollectionStill = () => (
  <LandingStill>
    <p className="type-display mb-5 text-3xl text-foreground">Collection</p>
    <SortChips value={{ sort: 'added', order: 'desc' }} onSelect={() => {}} />
    <RecordList>
      {RECORDS.map((record) => (
        <li key={record.title}>
          <StillRow record={record} meta={record.added} />
        </li>
      ))}
    </RecordList>
  </LandingStill>
)
