import { collectionQueryOptions } from '#/features/collection/collection.queries'
import { formatDateAdded } from '#/features/collection/collection.utils'
import { useSuspenseInfiniteQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'

export { collectionQueryOptions }

export const Route = createFileRoute('/_authenticated/collection')({
  loader: ({ context: { queryClient } }) =>
    queryClient.prefetchInfiniteQuery(collectionQueryOptions),
  component: Collection,
})

function Collection() {
  const { data, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useSuspenseInfiniteQuery(collectionQueryOptions)

  const releases = data.pages.flatMap((p) => p.releases)

  return (
    <main className="page-wrap px-4 pb-24 pt-14 sm:pb-8">
      <header className="mb-8">
        <p className="island-kicker mb-2">Vinyl</p>
        <h1 className="display-title text-4xl font-bold tracking-tight text-(--sea-ink)">
          Collection
        </h1>
      </header>

      {releases.length === 0 ? (
        <p className="text-(--sea-ink-soft)">
          No records in your collection yet.
        </p>
      ) : (
        <>
          <ul className="flex flex-col gap-3">
            {releases.map((release, index) => (
              <li key={release.instance_id}>
                <Link
                  to="/collection/$id"
                  params={{ id: String(release.id) }}
                  className="island-shell feature-card rise-in flex items-center gap-4 rounded-2xl px-4 py-3 no-underline cursor-pointer"
                  style={{ animationDelay: `${index * 60}ms` }}
                >
                  <img
                    src={release.basic_information.thumb}
                    alt={release.basic_information.title}
                    className="h-12 w-12 rounded-lg object-cover shrink-0"
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
                      {formatDateAdded(release.date_added)}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>

          {hasNextPage && (
            <div className="mt-6 flex justify-center">
              <button
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="island-shell rise-in rounded-full px-6 py-2.5 text-sm font-medium text-(--sea-ink) disabled:opacity-50 cursor-pointer"
              >
                {isFetchingNextPage ? 'Loading…' : 'Load more'}
              </button>
            </div>
          )}
        </>
      )}
    </main>
  )
}
