import { wantlistQueryOptions } from '#/features/wantlist/wantlist.queries'
import { useSuspenseInfiniteQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'

export { wantlistQueryOptions }

export const Route = createFileRoute('/_authenticated/wantlist')({
  loader: ({ context: { queryClient } }) =>
    queryClient.prefetchInfiniteQuery(wantlistQueryOptions),
  component: Wantlist,
})

function formatDateAdded(dateAdded: string): string {
  return new Date(dateAdded).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function Wantlist() {
  const { data, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useSuspenseInfiniteQuery(wantlistQueryOptions)

  const wants = data.pages.flatMap((p) => p.wants)

  return (
    <main className="page-wrap px-4 pb-8 pt-14">
      <header className="mb-8">
        <p className="island-kicker mb-2">Vinyl</p>
        <h1 className="display-title text-4xl font-bold tracking-tight text-(--sea-ink)">
          Wantlist
        </h1>
      </header>

      {wants.length === 0 ? (
        <p className="text-(--sea-ink-soft)">Your wantlist is empty.</p>
      ) : (
        <>
          <ul className="flex flex-col gap-3">
            {wants.map((want, index) => (
              <li key={want.id}>
                <Link
                  to="/wantlist/$id"
                  params={{ id: String(want.id) }}
                  className="island-shell feature-card rise-in flex items-center gap-4 rounded-2xl px-4 py-3 no-underline cursor-pointer"
                  style={{ animationDelay: `${index * 60}ms` }}
                >
                  <img
                    src={want.basic_information.thumb}
                    alt={want.basic_information.title}
                    className="h-12 w-12 rounded-lg object-cover shrink-0"
                  />
                  <div className="flex flex-1 items-center justify-between">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-semibold text-(--sea-ink)">
                        {want.basic_information.title}
                      </span>
                      <span className="text-sm text-(--sea-ink-soft)">
                        {want.basic_information.artists[0]?.name}
                      </span>
                    </div>
                    <span className="font-mono text-xs text-(--sea-ink-soft)">
                      {formatDateAdded(want.date_added)}
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
