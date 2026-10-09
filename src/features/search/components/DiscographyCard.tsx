import { CoverArt } from '#/shared/components/CoverArt'
import {
  RECORD_ROW_MEDIA_CLASSES,
  RecordRow,
} from '#/shared/components/RecordList'
import { masterCoverKey } from '#/shared/utils/cover-key'
import type { ArtistDiscographyItem } from '../search.model'

interface DiscographyCardProps {
  item: ArtistDiscographyItem
  artistName: string
  onClick: () => void
}

export const DiscographyCard = ({
  item,
  artistName,
  onClick,
}: DiscographyCardProps) => (
  <li>
    <RecordRow
      onClick={onClick}
      media={
        <CoverArt
          coverKey={masterCoverKey(item.id)}
          artist={artistName}
          // The searched artist's own name last, should the record print another
          credits={[...item.credits, artistName]}
          title={item.title}
          styles={[]}
          className={RECORD_ROW_MEDIA_CLASSES}
        />
      }
      title={item.title}
      meta={item.year}
    />
  </li>
)
