import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { z } from 'zod'

import { toReleaseDetail } from '#/features/search/search.model'
import { releaseDetailQueryOptions } from '#/features/search/search.queries'
import { CoverArt } from '#/shared/components/CoverArt'
import { extractColors } from '#/shared/utils/extractColors'

export const Route = createFileRoute('/_authenticated/search_/$releaseId')({
  validateSearch: z.object({
    q: z.string().default(''),
    masterId: z.string().optional(),
  }),
  loader: ({ context: { queryClient }, params }) =>
    queryClient.prefetchQuery(releaseDetailQueryOptions(params.releaseId)),
  component: ReleaseDetail,
})

function ReleaseDetail() {
  const { releaseId } = Route.useParams()
  const { q, masterId } = Route.useSearch()
  const { data: raw } = useSuspenseQuery(releaseDetailQueryOptions(releaseId))
  const release = toReleaseDetail(raw)

  const colors = release.formatText ? extractColors(release.formatText) : []

  return (
    <main className="page-wrap px-4 pb-24 sm:pb-8 pt-14">
      <Link
        to="/search"
        search={{ q, masterId }}
        className="island-kicker rise-in mb-8 inline-flex items-center gap-1.5 no-underline"
      >
        ← Search
      </Link>

      <article
        className="island-shell rise-in relative overflow-hidden rounded-4xl px-6 py-10 sm:px-10 sm:py-14"
        style={{ animationDelay: '60ms' }}
      >
        <div className="pointer-events-none absolute -left-20 -top-24 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(79,184,178,0.32),transparent_66%)]" />
        <div className="pointer-events-none absolute -bottom-20 -right-20 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(47,106,74,0.18),transparent_66%)]" />

        <div className="relative flex flex-col gap-8 sm:flex-row sm:items-start">
          <CoverArt
            releaseId={releaseId}
            artist={release.artists[0] ?? ''}
            title={release.title}
            thumb={release.coverImage || null}
            styles={[]}
            className="w-full sm:w-72 aspect-square shrink-0 rounded-2xl overflow-hidden"
          />

          <div className="flex flex-col gap-4">
            {release.artists.length > 0 && (
              <p className="island-kicker">{release.artists.join(', ')}</p>
            )}
            <h1 className="display-title text-4xl font-bold tracking-tight text-(--sea-ink) sm:text-5xl">
              {release.title}
            </h1>

            <dl className="mt-2 flex flex-col gap-2 font-mono text-sm text-(--sea-ink-soft)">
              {release.year > 0 && (
                <div className="flex gap-3">
                  <dt>Year</dt>
                  <dd>{release.year}</dd>
                </div>
              )}
              {release.country && (
                <div className="flex gap-3">
                  <dt>Country</dt>
                  <dd>{release.country}</dd>
                </div>
              )}
              {release.formatName && (
                <div className="flex gap-3">
                  <dt>Format</dt>
                  <dd>{release.formatName}</dd>
                </div>
              )}
              {release.formatText && (
                <div className="flex gap-3">
                  <dt>Pressing</dt>
                  <dd>{release.formatText}</dd>
                </div>
              )}
              {colors.length > 0 && (
                <div className="flex gap-3">
                  <dt>Vinyl</dt>
                  <dd className="flex items-center gap-2">
                    {colors.map((color) => (
                      <span
                        key={color}
                        title={color}
                        className="inline-flex items-center gap-1.5"
                      >
                        <span
                          className="h-3.5 w-3.5 rounded-full border border-(--line) shrink-0"
                          style={{ background: color }}
                        />
                        <span className="capitalize">{color}</span>
                      </span>
                    ))}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      </article>
    </main>
  )
}
