import { CollectionIcon } from '#/shared/components/icons/CollectionIcon'
import { WantlistIcon } from '#/shared/components/icons/WantlistIcon'

import type { Master } from '../search.model'
import { CoverArt } from '#/shared/components/CoverArt'
import {
  RECORD_ROW_MEDIA_CLASSES,
  RecordRow,
} from '#/shared/components/RecordList'
import { masterCoverKey } from '#/shared/utils/cover-key'

// Record-like mark → round
const BADGE_CLASSES =
  'flex size-5 items-center justify-center rounded-full bg-foreground text-background'

interface MasterCardProps {
  master: Master
  onClick: () => void
}

export const MasterCard = ({ master, onClick }: MasterCardProps) => {
  const hasBadges = master.inCollection || master.inWantlist

  return (
    <li>
      <RecordRow
        onClick={onClick}
        media={
          <CoverArt
            coverKey={masterCoverKey(master.id)}
            artist={master.artist}
            title={master.title}
            thumb={master.thumb || null}
            styles={[]}
            className={RECORD_ROW_MEDIA_CLASSES}
          />
        }
        artist={master.artist}
        title={master.title}
        badges={
          hasBadges && (
            <span className="flex shrink-0 items-center gap-1">
              {master.inCollection && (
                <span className={BADGE_CLASSES} title="In your collection">
                  <CollectionIcon className="size-3" />
                </span>
              )}
              {master.inWantlist && (
                <span className={BADGE_CLASSES} title="On your wantlist">
                  <WantlistIcon className="size-3" />
                </span>
              )}
            </span>
          )
        }
        meta={master.year}
      />
    </li>
  )
}
