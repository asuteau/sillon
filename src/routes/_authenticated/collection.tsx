import { useRemoveFromCollection } from '#/features/collection/collection.mutations'
import { collectionQueryOptions } from '#/features/collection/collection.queries'
import { formatDateAdded } from '#/features/collection/collection.utils'
import type { CollectionRelease } from '#/features/collection/collection.schema'
import { RecordList } from '#/shared/components/RecordList'
import { ReleaseRow } from '#/features/collection/components/ReleaseRow'
import { Button } from '#/shared/components/ui/button'
import { GrooveLoader } from '#/shared/components/brand/GrooveLoader'
import { ReleaseSheet } from '#/shared/components/ReleaseSheet'
import { ScanFab } from '#/shared/components/ScanFab'
import { RandomPickButton } from '#/features/collection/components/RandomPickButton'
import { SortChips } from '#/shared/components/SortChips'
import {
  formatYear,
  listSortSchema,
  nextListSort,
  resolveListSort,
  toListSortSearch,
} from '#/shared/utils/list-sort'
import type { SortKey } from '#/shared/utils/list-sort'
import { useSuspenseInfiniteQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { CollectionIcon } from '#/shared/components/icons/CollectionIcon'
import { useState, useTransition } from 'react'
import { Page } from '#/shared/components/Page'

export const Route = createFileRoute('/_authenticated/collection')({
  validateSearch: listSortSchema,
  loaderDeps: ({ search }) => resolveListSort(search),
  loader: ({ context: { queryClient }, deps }) =>
    queryClient.prefetchInfiniteQuery(collectionQueryOptions(deps)),
  component: Collection,
})

function Collection() {
  const listSort = resolveListSort(Route.useSearch())
  const navigate = Route.useNavigate()
  const [isSortPending, startSortTransition] = useTransition()
  const { data, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useSuspenseInfiniteQuery(collectionQueryOptions(listSort))
  const [selected, setSelected] = useState<CollectionRelease | null>(null)

  const handleSortSelect = (key: SortKey) => {
    startSortTransition(async () => {
      await navigate({ search: toListSortSearch(nextListSort(listSort, key)) })
    })
  }

  const removeFromCollection = useRemoveFromCollection()
  const isEmpty = data.pages[0]?.releases.length === 0

  return (
    <Page>
      <header className="mb-6 flex items-end justify-between gap-4">
        <h1 className="type-display text-4xl text-foreground">Collection</h1>
        {!isEmpty && <RandomPickButton />}
      </header>

      <SortChips
        value={listSort}
        onSelect={handleSortSelect}
        isPending={isSortPending}
      />

      {isEmpty ? (
        <p className="text-muted-foreground">
          No records in your collection yet.
        </p>
      ) : (
        <>
          <RecordList aria-busy={isSortPending}>
            {data.pages.map((page) =>
              page.releases.map((release) => (
                <li key={release.instance_id}>
                  <ReleaseRow
                    release={release}
                    meta={
                      listSort.sort === 'year'
                        ? formatYear(release.basic_information.year)
                        : formatDateAdded(release.date_added)
                    }
                    onClick={() => setSelected(release)}
                  />
                </li>
              )),
            )}
          </RecordList>

          {hasNextPage && (
            <div className="mt-6 flex justify-center">
              <Button
                variant="outline"
                size="lg"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
              >
                {isFetchingNextPage ? (
                  <>
                    Loading…
                    <GrooveLoader size={14} />
                  </>
                ) : (
                  'Load more'
                )}
              </Button>
            </div>
          )}
        </>
      )}

      {selected && (
        <ReleaseSheet
          release={selected}
          onClose={() => setSelected(null)}
          onRemove={() =>
            removeFromCollection.mutate(
              {
                releaseId: selected.id,
                copy: {
                  instanceId: selected.instance_id,
                  folderId: selected.folder_id,
                },
              },
              {
                onSuccess: () => setSelected(null),
              },
            )
          }
          isRemoving={removeFromCollection.isPending}
          removeLabel="Remove from collection"
          removeIcon={<CollectionIcon className="size-4" />}
        />
      )}

      <ScanFab />
    </Page>
  )
}
