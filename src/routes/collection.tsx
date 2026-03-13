import { records } from '#/mocks/records'
import { queryOptions, useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'

const collectionQueryOptions = queryOptions({
  queryKey: ['collection'],
  queryFn: async () => {
    await new Promise((resolve) => setTimeout(resolve, 300))
    return records
  },
})

export const Route = createFileRoute('/collection')({
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

      <ul className="flex flex-col gap-3">
        {data.map((record, index) => (
          <li key={record.id}>
            <Link
              to="/collection/$id"
              params={{ id: record.id }}
              className="island-shell feature-card rise-in flex items-center justify-between rounded-2xl px-6 py-4 no-underline"
              style={{ animationDelay: `${index * 60}ms` }}
            >
              <div className="flex flex-col gap-0.5">
                <span className="font-semibold text-(--sea-ink)">
                  {record.title}
                </span>
                <span className="text-sm text-(--sea-ink-soft)">
                  {record.artist}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-mono text-xs text-(--sea-ink-soft)">
                  {record.year}
                </span>
                <span className="text-(--lagoon-deep) opacity-50 transition-opacity group-hover:opacity-100">
                  →
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  )
}
