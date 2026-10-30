import { useRemoveFromWantlist } from '#/features/wantlist/wantlist.mutations'
import {
  newestFirstWantlistQueryOptions,
  wantlistQueryOptions,
} from '#/features/wantlist/wantlist.queries'
import type { WantlistItem } from '#/features/wantlist/wantlist.schema'
import { FilteredWantlist } from '#/features/wantlist/components/FilteredWantlist'
import { WantlistFilterPicker } from '#/features/wantlist/components/WantlistFilterPicker'
import { formatListMeta } from '#/features/collection/collection.utils'
import { RecordList } from '#/shared/components/RecordList'
import { ReleaseRow } from '#/features/collection/components/ReleaseRow'
import { Button } from '#/shared/components/ui/button'
import { GrooveLoader } from '#/shared/components/brand/GrooveLoader'
import { RecordScreen, RemoveAction } from '#/shared/components/RecordScreen'
import { SortChips } from '#/shared/components/SortChips'
import {
  hasFilters,
  listFilterSchema,
  pickFilters,
  withoutFilter,
} from '#/shared/utils/list-filter'
import type { FilterKind, ListFilters } from '#/shared/utils/list-filter'
import {
  listSortSchema,
  nextListSort,
  resolveListSort,
  toListSortSearch,
} from '#/shared/utils/list-sort'
import type { ListSort, SortKey } from '#/shared/utils/list-sort'
import { useSuspenseInfiniteQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { WantlistIcon } from '#/shared/components/icons/WantlistIcon'
import { useMemo, useState, useTransition } from 'react'
import type { ReactNode } from 'react'
import { Page } from '#/shared/components/Page'
import { DiscogsAttribution } from '#/shared/components/DiscogsAttribution'
import { discogsWantlistUrl } from '#/shared/utils/discogs-urls'

export const Route = createFileRoute('/_authenticated/wantlist')({
  // Filters sit next to the sort, apart from the Collection's own
  validateSearch: listSortSchema.extend(listFilterSchema.shape),
  loaderDeps: ({ search }) => ({
    listSort: resolveListSort(search),
    isFiltered: hasFilters(search),
  }),
  // Filtered: the first page of the full read, newest first, which a short
  // Wantlist already holds whole
  loader: ({ context: { queryClient }, deps }) =>
    queryClient.prefetchInfiniteQuery(
      deps.isFiltered
        ? newestFirstWantlistQueryOptions
        : wantlistQueryOptions(deps.listSort),
    ),
  component: Wantlist,
})

function Wantlist() {
  const { user } = Route.useRouteContext()
  const search = Route.useSearch()
  // Stable while the URL is: the filtered list is derived from both
  const listSort = useMemo(() => resolveListSort(search), [search])
  const filters = useMemo(() => pickFilters(search), [search])
  const navigate = Route.useNavigate()
  const [isSortPending, startSortTransition] = useTransition()
  const [selected, setSelected] = useState<WantlistItem | null>(null)

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
  // A pick from the picker: every kind, the unset ones undefined
  const handleFiltersChange = (next: ListFilters) =>
    void navigate({ search: (prev) => ({ ...prev, ...next }) })
  const handleClearFilters = () =>
    void navigate({ search: (prev) => toListSortSearch(resolveListSort(prev)) })

  const removeFromWantlist = useRemoveFromWantlist()

  const renderHeading = (hasRecords: boolean) => (
    <>
      <h1 className="type-display mb-6 text-4xl text-foreground">Wantlist</h1>
      <div className="mb-6 flex items-center gap-2">
        {hasRecords && (
          <>
            <WantlistFilterPicker
              filters={filters}
              onFiltersChange={handleFiltersChange}
            />
            <span aria-hidden className="h-5 w-px shrink-0 bg-border" />
          </>
        )}
        <SortChips
          value={listSort}
          onSelect={handleSortSelect}
          isPending={isSortPending}
          className="mb-0 min-w-0 flex-1"
        />
      </div>
    </>
  )

  return (
    <Page>
      {hasFilters(filters) ? (
        <>
          {renderHeading(true)}
          <FilteredWantlist
            filters={filters}
            listSort={listSort}
            onRemoveFilter={handleRemoveFilter}
            onClearFilters={handleClearFilters}
            onSelect={setSelected}
          />
        </>
      ) : (
        <WantlistList
          listSort={listSort}
          isSortPending={isSortPending}
          renderHeading={renderHeading}
          onSelect={setSelected}
        />
      )}

      {user && <DiscogsAttribution href={discogsWantlistUrl(user.username)} />}

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

interface WantlistListProps {
  listSort: ListSort
  isSortPending: boolean
  renderHeading: (hasRecords: boolean) => ReactNode
  onSelect: (want: WantlistItem) => void
}

// The whole Wantlist, sorted by Discogs, a page at a time
const WantlistList = ({
  listSort,
  isSortPending,
  renderHeading,
  onSelect,
}: WantlistListProps) => {
  const { data, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useSuspenseInfiniteQuery(wantlistQueryOptions(listSort))

  if (data.pages[0]?.wants.length === 0) {
    return (
      <>
        {renderHeading(false)}
        <p className="text-muted-foreground">Your wantlist is empty.</p>
      </>
    )
  }

  return (
    <>
      {renderHeading(true)}
      <RecordList aria-busy={isSortPending}>
        {data.pages.map((page) =>
          page.wants.map((want) => (
            <li key={want.id}>
              <ReleaseRow
                release={want}
                meta={formatListMeta(want, listSort.sort)}
                onClick={() => onSelect(want)}
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
