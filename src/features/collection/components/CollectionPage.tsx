import { useState } from 'react'

import { CollectionIcon } from '#/shared/components/icons/CollectionIcon'
import { DiscogsAttribution } from '#/shared/components/DiscogsAttribution'
import { ListView } from '#/shared/components/ListView'
import { Page } from '#/shared/components/Page'
import { RecordScreen, RemoveAction } from '#/shared/components/RecordScreen'
import type { ListSearch } from '#/shared/hooks/use-list-search'
import { discogsCollectionUrl } from '#/shared/utils/discogs-urls'
import { formatListMeta } from '#/shared/utils/list-meta'

import { useRemoveFromCollection } from '../collection.mutations'
import { collectionQueryOptions, collectionSource } from '../collection.queries'
import type { CollectionRelease } from '../collection.schema'
import { RandomPickButton } from './RandomPickButton'
import { ReleaseRow } from './ReleaseRow'

const COLLECTION_CONFIG = {
  source: collectionSource,
  pagedOptions: collectionQueryOptions,
  empty: 'No records in your collection yet.',
}

interface CollectionPageProps {
  search: ListSearch
  username: string | undefined
}

export const CollectionPage = ({ search, username }: CollectionPageProps) => {
  const [selected, setSelected] = useState<CollectionRelease | null>(null)
  const removeFromCollection = useRemoveFromCollection()

  return (
    <Page>
      <ListView
        config={COLLECTION_CONFIG}
        path="/collection"
        search={search}
        title="Collection"
        // Random pick ignores filters, and needs a record to pick
        action={<RandomPickButton />}
        renderRecord={(release, listSort) => (
          <ReleaseRow
            release={release}
            meta={formatListMeta(release, listSort.sort)}
            onClick={() => setSelected(release)}
          />
        )}
      />

      {username && <DiscogsAttribution href={discogsCollectionUrl(username)} />}

      {selected && (
        <RecordScreen
          record={selected}
          onClose={() => setSelected(null)}
          actions={
            <RemoveAction
              label="Remove from collection"
              icon={<CollectionIcon className="size-4" />}
              isRemoving={removeFromCollection.isPending}
              onRemove={() =>
                removeFromCollection.mutate(
                  {
                    releaseId: selected.id,
                    copy: {
                      instanceId: selected.instance_id,
                      folderId: selected.folder_id,
                    },
                  },
                  { onSuccess: () => setSelected(null) },
                )
              }
            />
          }
        />
      )}
    </Page>
  )
}
