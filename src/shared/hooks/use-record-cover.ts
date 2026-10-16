import { useCoverTint } from '#/shared/hooks/use-cover-tint'
import { useCoverTransition } from '#/shared/hooks/use-cover-transition'
import { recordCredits } from '#/shared/utils/artist-name'
import { releaseCoverKey } from '#/shared/utils/cover-key'

// Shared by Collection, Wantlist and Search records
interface RecordCoverRelease {
  id: number
  basic_information: {
    master_id?: number
    title: string
    artists: { name: string; anv?: string }[]
  }
}

// Record screens' Cover: its tint, and the cover → detail transition.
// No record yet (still being prepared): no tint
export const useRecordCover = (release: RecordCoverRelease | undefined) => {
  const info = release?.basic_information
  const tint = useCoverTint(
    release && info
      ? {
          coverKey: releaseCoverKey(release.id, info.master_id),
          credits: recordCredits(info.artists),
          title: info.title,
        }
      : null,
  )
  const { sheetCover, flyBack } = useCoverTransition()
  return { tint, sheetCover, flyBack }
}
