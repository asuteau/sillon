import { useState } from 'react'

import { ReleaseRow } from '#/features/collection/components/ReleaseRow'
import { DiscogsAttribution } from '#/shared/components/DiscogsAttribution'
import { WantlistIcon } from '#/shared/components/icons/WantlistIcon'
import { ListView } from '#/shared/components/ListView'
import { Page } from '#/shared/components/Page'
import { RecordScreen, RemoveAction } from '#/shared/components/RecordScreen'
import type { ListSearch } from '#/shared/hooks/use-list-search'
import { discogsWantlistUrl } from '#/shared/utils/discogs-urls'
import { formatListMeta } from '#/shared/utils/list-meta'

import { useRemoveFromWantlist } from '../wantlist.mutations'
import { wantlistQueryOptions, wantlistSource } from '../wantlist.queries'
import type { WantlistItem } from '../wantlist.schema'

const WANTLIST_CONFIG = {
  source: wantlistSource,
  pagedOptions: wantlistQueryOptions,
  empty: 'Your wantlist is empty.',
  // Read whole for the picker, the Wantlist then sorts on the device
  servesWholeRead: true,
}

interface WantlistPageProps {
  search: ListSearch
  username: string | undefined
}

export const WantlistPage = ({ search, username }: WantlistPageProps) => {
  const [selected, setSelected] = useState<WantlistItem | null>(null)
  const removeFromWantlist = useRemoveFromWantlist()

  return (
    <Page>
      <ListView
        config={WANTLIST_CONFIG}
        path="/wantlist"
        search={search}
        title="Wantlist"
        renderRecord={(want, listSort) => (
          <ReleaseRow
            release={want}
            meta={formatListMeta(want, listSort.sort)}
            onClick={() => setSelected(want)}
          />
        )}
      />

      {username && <DiscogsAttribution href={discogsWantlistUrl(username)} />}

      {selected && (
        <RecordScreen
          record={selected}
          onClose={() => setSelected(null)}
          actions={
            <RemoveAction
              label="Remove from wantlist"
              icon={<WantlistIcon className="size-4" />}
              isRemoving={removeFromWantlist.isPending}
              onRemove={() =>
                removeFromWantlist.mutate(selected.id, {
                  onSuccess: () => setSelected(null),
                })
              }
            />
          }
        />
      )}
    </Page>
  )
}
