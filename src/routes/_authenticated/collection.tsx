import { useRemoveFromCollection } from '#/features/collection/collection.mutations'
import { collectionQueryOptions } from '#/features/collection/collection.queries'
import { formatDateAdded } from '#/features/collection/collection.utils'
import type { CollectionRelease } from '#/features/collection/collection.schema'
import { CoverArt } from '#/shared/components/CoverArt'
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
import { Disc3, Library } from 'lucide-react'
import { useState, useTransition } from 'react'

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

  return (
    <main className="page-wrap px-4 pb-32 pt-14 sm:pb-8">
      <header className="mb-8">
        <p className="island-kicker mb-2">Vinyl</p>
        <h1 className="display-title text-4xl font-bold tracking-tight text-(--sea-ink)">
          Collection
        </h1>
      </header>

      <SortChips
        value={listSort}
        onSelect={handleSortSelect}
        isPending={isSortPending}
      />

      {data.pages[0]?.releases.length === 0 ? (
        <p className="text-(--sea-ink-soft)">
          No records in your collection yet.
        </p>
      ) : (
        <>
          <ul
            aria-busy={isSortPending}
            className={`flex flex-col gap-3 transition-opacity ${isSortPending ? 'opacity-50' : ''}`}
          >
            {data.pages.map((page) =>
              page.releases.map((release, index) => (
                <li key={release.instance_id}>
                  <button
                    type="button"
                    onClick={() => setSelected(release)}
                    className="island-shell feature-card rise-in flex w-full items-center gap-4 rounded-2xl px-4 py-3 cursor-pointer text-left"
                    style={{ animationDelay: `${index * 20}ms` }}
                  >
                    <CoverArt
                      releaseId={String(release.id)}
                      artist={release.basic_information.artists[0]?.name ?? ''}
                      title={release.basic_information.title}
                      thumb={release.basic_information.thumb}
                      styles={release.basic_information.styles}
                      size={48}
                      className="rounded-lg shrink-0 overflow-hidden"
                    />
                    <div className="flex flex-1 items-center justify-between">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-semibold text-(--sea-ink)">
                          {release.basic_information.title}
                        </span>
                        <span className="text-sm text-(--sea-ink-soft)">
                          {release.basic_information.artists[0]?.name}
                        </span>
                      </div>
                      <span className="font-mono text-xs text-(--sea-ink-soft)">
                        {listSort.sort === 'year'
                          ? formatYear(release.basic_information.year)
                          : formatDateAdded(release.date_added)}
                      </span>
                    </div>
                  </button>
                </li>
              )),
            )}
          </ul>

          {hasNextPage && (
            <div className="mt-6 flex justify-center">
              <button
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="island-shell rise-in rounded-full px-6 py-2.5 text-sm font-medium text-(--sea-ink) disabled:opacity-50 cursor-pointer flex items-center gap-2"
              >
                {isFetchingNextPage ? (
                  <>
                    Loading…
                    <Disc3 size={14} className="animate-spin opacity-70" />
                  </>
                ) : (
                  'Load more'
                )}
              </button>
            </div>
          )}
        </>
      )}

      {selected && (
        <ReleaseSheet
          release={selected}
          onClose={() => setSelected(null)}
          onRemove={() =>
            removeFromCollection.mutate(selected.id, {
              onSuccess: () => setSelected(null),
            })
          }
          isRemoving={removeFromCollection.isPending}
          removeLabel="Remove from collection"
          removeIcon={<Library className="h-4 w-4" />}
        />
      )}

      <ScanFab />
    </main>
  )
}
