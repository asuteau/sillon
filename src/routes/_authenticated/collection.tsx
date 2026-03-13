import { getRecentAdditions } from '#/lib/recentAdditions'
import { queryOptions, useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'

const collectionQueryOptions = queryOptions({
  queryKey: ['collection', { perPage: 20 }],
  queryFn: () => getRecentAdditions({ data: { perPage: 20 } }),
})

export const Route = createFileRoute('/_authenticated/collection')({
  loader: ({ context: { queryClient } }) =>
    queryClient.ensureQueryData(collectionQueryOptions),
  component: Collection,
})

function Collection() {
  const { data } = useSuspenseQuery(collectionQueryOptions)

  return (
    <main className="page-wrap px-4 pb-8 pt-14">
      <header className="mb-8">
        <p className="island-kicker mb-2">Vinyl</p>
        <h1 className="display-title text-4xl font-bold tracking-tight text-(--sea-ink)">
          Collection
        </h1>
      </header>

      {data.length === 0 ? (
        <p className="text-(--sea-ink-soft)">No records in your collection yet.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {data.map((release, index) => (
            <li key={release.instance_id}>
              <div
                className="island-shell feature-card rise-in flex items-center gap-4 rounded-2xl px-4 py-3"
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
                    {new Date(release.date_added).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
