import { StackBar, stackBarNotes } from '#/features/scan/components/StackBar'
import { StackRow } from '#/features/scan/components/StackRow'
import { stackSummary } from '#/features/scan/stack.model'
import type { ReleaseMatch } from '#/features/scan/stack.model'
import { CountBadge } from '#/shared/components/CountBadge'
import { HouseSleeve } from '#/shared/components/HouseSleeve'
import {
  RECORD_ROW_MEDIA_CLASSES,
  RecordList,
} from '#/shared/components/RecordList'

import { LANDING_STACK } from '../content/landing-stack.content'
import { LandingStill } from './LandingStill'
import { ScanViewfinder } from './ScanViewfinder'

const LIST = 'collection'
const SUMMARY = stackSummary(LANDING_STACK, LIST)
const NOTES = stackBarNotes({
  list: LIST,
  summary: SUMMARY,
  failedCount: 0,
  isCommitting: false,
})

const noop = () => {}

const houseSleeve = (release: ReleaseMatch) => (
  <HouseSleeve
    artist={release.artist}
    title={release.title}
    className={RECORD_ROW_MEDIA_CLASSES}
  />
)

// The scanner's viewfinder over a sleeve's barcode, the Stack piling up
// under it, and the bar that adds it at once
export const ScanStill = () => (
  <LandingStill className="flex flex-col gap-5">
    <ScanViewfinder className="aspect-4/3" />

    <div className="flex flex-col gap-4">
      <div>
        <p className="type-caps mb-2 flex items-center gap-2 text-[11px] text-muted-foreground">
          <span>Stack</span>
          <CountBadge count={LANDING_STACK.records.length} />
        </p>
        <RecordList>
          {LANDING_STACK.records.map((record) => (
            <StackRow
              key={record.barcode}
              record={record}
              list={LIST}
              addState={undefined}
              highlightKey={undefined}
              onClick={noop}
              onToggleIncluded={noop}
              onRetry={noop}
              isCommitting={false}
              renderCover={houseSleeve}
            />
          ))}
        </RecordList>
      </div>

      <StackBar
        list={LIST}
        summary={SUMMARY}
        notes={NOTES}
        recordCount={LANDING_STACK.records.length}
        isCommitting={false}
        isPaused={false}
        onConfirm={noop}
        onChooseNext={noop}
        onSwitchList={noop}
        onClear={noop}
        onClose={noop}
      />
    </div>
  </LandingStill>
)
