import {
  formatArtists,
  leadArtist,
} from '#/features/collection/collection.utils'
import { CoverArt } from '#/shared/components/CoverArt'
import {
  RECORD_ROW_MEDIA_CLASSES,
  RecordRow,
} from '#/shared/components/RecordList'
import { releaseCoverKey } from '#/shared/utils/cover-key'
import { setCoverOrigin } from '#/shared/utils/cover-transition'

// Shared by Collection and Wantlist items
interface ReleaseRowRelease {
  id: number
  basic_information: {
    master_id?: number
    title: string
    artists: { name: string }[]
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
      onClick={(event) => {
        // The record screen grows from this Cover
        setCoverOrigin(
          event.currentTarget.querySelector<HTMLElement>('[data-slot="cover"]'),
        )
        onClick()
      }}
      media={
        <CoverArt
          coverKey={releaseCoverKey(release.id, info.master_id)}
          artist={leadArtist(info.artists)}
          title={info.title}
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
