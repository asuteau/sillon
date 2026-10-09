import { useCoverTint } from '#/shared/hooks/use-cover-tint'
import { useCoverTransition } from '#/shared/hooks/use-cover-transition'
import { recordCredits } from '#/shared/utils/artist-name'
import { releaseCoverKey } from '#/shared/utils/cover-key'

// Shared by Collection and Wantlist items
interface RecordCoverRelease {
  id: number
  basic_information: {
    master_id?: number
    title: string
    artists: { name: string; anv?: string }[]
  }
}

// Record screens' Cover: its tint, and the cover → detail transition
export const useRecordCover = (release: RecordCoverRelease) => {
  const { basic_information: info } = release
  const tint = useCoverTint({
    coverKey: releaseCoverKey(release.id, info.master_id),
    credits: recordCredits(info.artists),
    title: info.title,
  })
  const { sheetCover, flyBack } = useCoverTransition()
  return { tint, sheetCover, flyBack }
}
