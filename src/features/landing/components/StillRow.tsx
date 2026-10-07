import { HouseSleeve } from '#/shared/components/HouseSleeve'
import {
  RECORD_ROW_MEDIA_CLASSES,
  RecordRow,
} from '#/shared/components/RecordList'

import type { LandingRecord } from '../landing.content'

interface StillRowProps {
  record: LandingRecord
  meta: string
  badges?: React.ReactNode
}

// A RecordRow as the lists show it, with a House sleeve for its Cover
export const StillRow = ({ record, meta, badges }: StillRowProps) => (
  <RecordRow
    onClick={() => {}}
    media={
      <HouseSleeve
        artist={record.artist}
        title={record.title}
        className={RECORD_ROW_MEDIA_CLASSES}
      />
    }
    artist={record.artist}
    title={record.title}
    meta={meta}
    badges={badges}
  />
)
