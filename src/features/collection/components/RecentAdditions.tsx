import { useRemoveFromCollection } from '#/features/collection/collection.mutations'
import type { CollectionRelease } from '#/features/collection/collection.schema'
import { SleevePull } from '#/features/collection/components/SleevePull'
import { DiscogsAttribution } from '#/shared/components/DiscogsAttribution'
import { CollectionIcon } from '#/shared/components/icons/CollectionIcon'
import { RecordScreen, RemoveAction } from '#/shared/components/RecordScreen'
import { discogsCollectionUrl } from '#/shared/utils/discogs-urls'
import { useState } from 'react'

interface RecentAdditionsProps {
  /** Newest first; undefined until loaded or restored from the device */
  records: CollectionRelease[] | undefined
  username: string
}

// Home's opening block: the Sleeve pull, and the record screen it opens
export const RecentAdditions = ({
  records,
  username,
}: RecentAdditionsProps) => {
  const [selected, setSelected] = useState<CollectionRelease | null>(null)
  const removeFromCollection = useRemoveFromCollection()

  const heading = (
    <h1 className="type-display m-0 text-4xl text-foreground">
      Recent additions
    </h1>
  )

  // Not loaded yet, server-side or restoring from the device: say nothing
  if (!records) return <section>{heading}</section>

  if (records.length === 0) {
    return (
      <section>
        {heading}
        <p className="mt-6 animate-in text-muted-foreground duration-160 ease-fade fade-in-0">
          No records in your collection yet.
        </p>
      </section>
    )
  }

  return (
    <section>
      {heading}
      <SleevePull records={records} isOpen={!!selected} onOpen={setSelected} />
      <DiscogsAttribution
        href={discogsCollectionUrl(username)}
        className="mt-4"
      />

      {selected && (
        <RecordScreen
          record={selected}
          onClose={() => setSelected(null)}
          actions={
            <RemoveAction
              label="Remove from collection"
              icon={<CollectionIcon />}
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
                  // The sheet fades; the next record slides into the centre
                  { onSuccess: () => setSelected(null) },
                )
              }
            />
          }
        />
      )}
    </section>
  )
}
