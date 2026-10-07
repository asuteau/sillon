import { useRemoveFromWantlist } from '#/features/wantlist/wantlist.mutations'
import { wantlistQueryOptions } from '#/features/wantlist/wantlist.queries'
import type { WantlistItem } from '#/features/wantlist/wantlist.schema'
import { formatDateAdded } from '#/features/collection/collection.utils'
import { RecordList } from '#/shared/components/RecordList'
import { ReleaseRow } from '#/features/collection/components/ReleaseRow'
import { Button } from '#/shared/components/ui/button'
import { GrooveLoader } from '#/shared/components/brand/GrooveLoader'
import { ReleaseSheet } from '#/shared/components/ReleaseSheet'
import { ScanFab } from '#/shared/components/ScanFab'
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
import { WantlistIcon } from '#/shared/components/icons/WantlistIcon'
import { useState, useTransition } from 'react'

export const Route = createFileRoute('/_authenticated/wantlist')({
  validateSearch: listSortSchema,
  loaderDeps: ({ search }) => resolveListSort(search),
  loader: ({ context: { queryClient }, deps }) =>
    queryClient.prefetchInfiniteQuery(wantlistQueryOptions(deps)),
  component: Wantlist,
})

function Wantlist() {
  const listSort = resolveListSort(Route.useSearch())
  const navigate = Route.useNavigate()
  const [isSortPending, startSortTransition] = useTransition()
  const { data, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useSuspenseInfiniteQuery(wantlistQueryOptions(listSort))
  const [selected, setSelected] = useState<WantlistItem | null>(null)

  const handleSortSelect = (key: SortKey) => {
    startSortTransition(async () => {
      await navigate({ search: toListSortSearch(nextListSort(listSort, key)) })
    })
  }

  const removeFromWantlist = useRemoveFromWantlist()

  return (
    <main className="mx-auto w-full max-w-270 px-4 pt-14 pb-32 sm:pb-8">
      <h1 className="type-display mb-6 text-4xl text-foreground">Wantlist</h1>

      <SortChips
        value={listSort}
        onSelect={handleSortSelect}
        isPending={isSortPending}
      />

      {data.pages[0]?.wants.length === 0 ? (
        <p className="text-muted-foreground">Your wantlist is empty.</p>
      ) : (
        <>
          <RecordList aria-busy={isSortPending}>
            {data.pages.map((page) =>
              page.wants.map((want) => (
                <li key={want.id}>
                  <ReleaseRow
                    release={want}
                    meta={
                      listSort.sort === 'year'
                        ? formatYear(want.basic_information.year)
                        : formatDateAdded(want.date_added)
                    }
                    onClick={() => setSelected(want)}
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
            removeFromWantlist.mutate(selected.id, {
              onSuccess: () => setSelected(null),
            })
          }
          isRemoving={removeFromWantlist.isPending}
          removeLabel="Remove from wantlist"
          removeIcon={<WantlistIcon className="size-4" />}
        />
      )}

      <ScanFab />
    </main>
  )
}
