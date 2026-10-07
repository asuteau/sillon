import { formatArtists } from '#/features/collection/collection.utils'
import { CoverArt } from '#/shared/components/CoverArt'
import {
  RECORD_ROW_MEDIA_CLASSES,
  RecordRow,
} from '#/shared/components/RecordList'
import { releaseCoverKey } from '#/shared/utils/cover-key'

// Shared by Collection and Wantlist items
interface ReleaseRowRelease {
  id: number
  basic_information: {
    master_id?: number
    title: string
    artists: { name: string }[]
    thumb: string
    styles: string[]
  }
}

interface ReleaseRowProps {
  release: ReleaseRowRelease
  // Catalogue line: year or date added
  meta: string
  onClick: () => void
}

export const ReleaseRow = ({ release, meta, onClick }: ReleaseRowProps) => {
  const { basic_information: info } = release

  return (
    <RecordRow
      onClick={onClick}
      media={
        <CoverArt
          coverKey={releaseCoverKey(release.id, info.master_id)}
          artist={info.artists[0]?.name ?? ''}
          title={info.title}
          thumb={info.thumb}
          styles={info.styles}
          className={RECORD_ROW_MEDIA_CLASSES}
        />
      }
      artist={formatArtists(info.artists)}
      title={info.title}
      meta={meta}
    />
  )
}
