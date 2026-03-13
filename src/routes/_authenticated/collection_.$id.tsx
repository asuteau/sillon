import { collectionQueryOptions } from '#/routes/_authenticated/collection'
import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/collection_/$id')({
  loader: ({ context: { queryClient } }) =>
    queryClient.ensureQueryData(collectionQueryOptions),
  component: RecordDetail,
})

function RecordDetail() {
  const { id } = Route.useParams()
  const { data } = useSuspenseQuery(collectionQueryOptions)
  const release = data.find((r) => r.id === Number(id))

  return (
    <main className="page-wrap px-4 pb-8 pt-14">
      <Link
        to="/collection"
        className="island-kicker rise-in mb-8 inline-flex items-center gap-1.5 no-underline"
      >
        ← Collection
      </Link>

      {!release ? (
        <p className="text-(--sea-ink-soft)">Release not found.</p>
      ) : (
        <article className="island-shell rise-in relative overflow-hidden rounded-4xl px-6 py-10 sm:px-10 sm:py-14" style={{ animationDelay: '60ms' }}>
          <div className="pointer-events-none absolute -left-20 -top-24 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(79,184,178,0.32),transparent_66%)]" />
          <div className="pointer-events-none absolute -bottom-20 -right-20 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(47,106,74,0.18),transparent_66%)]" />

          <div className="relative flex flex-col gap-8 sm:flex-row sm:items-start">
            <img
              src={release.basic_information.cover_image}
              alt={release.basic_information.title}
              className="w-full rounded-2xl object-cover sm:w-72 aspect-square shrink-0"
            />

            <div className="flex flex-col gap-4">
              <p className="island-kicker">
                {release.basic_information.artists.map((a) => a.name).join(', ')}
              </p>
              <h1 className="display-title text-4xl font-bold tracking-tight text-(--sea-ink) sm:text-5xl">
                {release.basic_information.title}
              </h1>

              <dl className="mt-2 flex flex-col gap-2 font-mono text-sm text-(--sea-ink-soft)">
                {release.basic_information.year > 0 && (
                  <div className="flex gap-3">
                    <dt>Year</dt>
                    <dd>{release.basic_information.year}</dd>
                  </div>
                )}
                <div className="flex gap-3">
                  <dt>Added</dt>
                  <dd>
                    {new Date(release.date_added).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </article>
      )}
    </main>
  )
}
