import { useRemoveFromCollection } from '#/features/collection/collection.mutations'
import {
  collectionQueryOptions,
  isPersistedListSort,
} from '#/features/collection/collection.queries'
import { formatListMeta } from '#/features/collection/collection.utils'
import type { CollectionRelease } from '#/features/collection/collection.schema'
import { FilteredCollection } from '#/features/collection/components/FilteredCollection'
import { RecordList } from '#/shared/components/RecordList'
import { ReleaseRow } from '#/features/collection/components/ReleaseRow'
import { Button } from '#/shared/components/ui/button'
import { GrooveLoader } from '#/shared/components/brand/GrooveLoader'
import { RecordScreen, RemoveAction } from '#/shared/components/RecordScreen'
import { RandomPickButton } from '#/features/collection/components/RandomPickButton'
import { SortChips } from '#/shared/components/SortChips'
import {
  hasFilters,
  listFilterSchema,
  pickFilters,
  withoutFilter,
} from '#/shared/utils/list-filter'
import type { FilterKind } from '#/shared/utils/list-filter'
import {
  listSortSchema,
  nextListSort,
  resolveListSort,
  toListSortSearch,
} from '#/shared/utils/list-sort'
import type { ListSort, SortKey } from '#/shared/utils/list-sort'
import { useSuspenseInfiniteQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { CollectionIcon } from '#/shared/components/icons/CollectionIcon'
import { useMemo, useState, useTransition } from 'react'
import type { ReactNode } from 'react'
import { Page } from '#/shared/components/Page'
import { DiscogsAttribution } from '#/shared/components/DiscogsAttribution'
import { discogsCollectionUrl } from '#/shared/utils/discogs-urls'

export const Route = createFileRoute('/_authenticated/collection')({
  // Filters sit next to the sort, e.g. ?style=Shoegaze&decade=1990&sort=year
  validateSearch: listSortSchema.extend(listFilterSchema.shape),
  // The newest-first list, and the full read filters run over, load on the
  // client, which may restore them from the device instead of asking Discogs
  ssr: ({ search }) =>
    search.status !== 'success' ||
    (!hasFilters(search.value) &&
      !isPersistedListSort(resolveListSort(search.value))),
  loaderDeps: ({ search }) => ({
    listSort: resolveListSort(search),
    isFiltered: hasFilters(search),
  }),
  loader: ({ context: { queryClient }, deps }) =>
    deps.isFiltered
      ? undefined
      : queryClient.prefetchInfiniteQuery(
          collectionQueryOptions(deps.listSort),
        ),
  component: Collection,
})

function Collection() {
  const { user } = Route.useRouteContext()
  const search = Route.useSearch()
  // Stable while the URL is: the filtered list is derived from both
  const listSort = useMemo(() => resolveListSort(search), [search])
  const filters = useMemo(() => pickFilters(search), [search])
  const navigate = Route.useNavigate()
  const [isSortPending, startSortTransition] = useTransition()
  const [selected, setSelected] = useState<CollectionRelease | null>(null)

  // Filters and sort are kept across each other's changes
  const handleSortSelect = (key: SortKey) => {
    startSortTransition(async () => {
      await navigate({
        search: (prev) => ({
          ...prev,
          ...toListSortSearch(nextListSort(listSort, key)),
        }),
      })
    })
  }
  const handleRemoveFilter = (kind: FilterKind) =>
    void navigate({ search: (prev) => withoutFilter(prev, kind) })
  const handleClearFilters = () =>
    void navigate({ search: (prev) => toListSortSearch(resolveListSort(prev)) })

  const removeFromCollection = useRemoveFromCollection()

  // Random pick ignores filters, and needs a record to pick
  const renderHeading = (hasRecords: boolean) => (
    <>
      <header className="mb-6 flex items-end justify-between gap-4">
        <h1 className="type-display text-4xl text-foreground">Collection</h1>
        {hasRecords && <RandomPickButton />}
      </header>
      <SortChips
        value={listSort}
        onSelect={handleSortSelect}
        isPending={isSortPending}
      />
    </>
  )

  return (
    <Page>
      {hasFilters(filters) ? (
        <>
          {renderHeading(true)}
          <FilteredCollection
            filters={filters}
            listSort={listSort}
            onRemoveFilter={handleRemoveFilter}
            onClearFilters={handleClearFilters}
            onSelect={setSelected}
          />
        </>
      ) : (
        <CollectionList
          listSort={listSort}
          isSortPending={isSortPending}
          renderHeading={renderHeading}
          onSelect={setSelected}
        />
      )}

      {user && (
        <DiscogsAttribution href={discogsCollectionUrl(user.username)} />
      )}

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

interface CollectionListProps {
  listSort: ListSort
  isSortPending: boolean
  renderHeading: (hasRecords: boolean) => ReactNode
  onSelect: (release: CollectionRelease) => void
}

// The whole Collection, sorted by Discogs, a page at a time
const CollectionList = ({
  listSort,
  isSortPending,
  renderHeading,
  onSelect,
}: CollectionListProps) => {
  const { data, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useSuspenseInfiniteQuery(collectionQueryOptions(listSort))

  if (data.pages[0]?.releases.length === 0) {
    return (
      <>
        {renderHeading(false)}
        <p className="text-muted-foreground">
          No records in your collection yet.
        </p>
      </>
    )
  }

  return (
    <>
      {renderHeading(true)}
      <RecordList aria-busy={isSortPending}>
        {data.pages.map((page) =>
          page.releases.map((release) => (
            <li key={release.instance_id}>
              <ReleaseRow
                release={release}
                meta={formatListMeta(release, listSort.sort)}
                onClick={() => onSelect(release)}
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
  )
}
