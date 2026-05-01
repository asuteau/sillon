import { useRemoveFromCollection } from '#/features/collection/collection.mutations'
import { collectionQueryOptions } from '#/features/collection/collection.queries'
import {
  formatArtists,
  formatDateAdded,
} from '#/features/collection/collection.utils'
import { Button } from '#/shared/components/ui/button'
import { CoverArt } from '#/shared/components/CoverArt'
import { useSuspenseInfiniteQuery } from '@tanstack/react-query'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { Library } from 'lucide-react'
import { z } from 'zod'

const RecordDetail = () => {
  const { id } = Route.useParams()
  const { from } = Route.useSearch()
  const navigate = useNavigate()
  const removeFromCollection = useRemoveFromCollection()
  const { data } = useSuspenseInfiniteQuery(collectionQueryOptions)
  const release = data.pages
    .flatMap((p) => p.releases)
    .find((r) => r.id === Number(id))

  return (
    <main className="page-wrap px-4 pb-24 sm:pb-8 pt-14">
      <Link
        to="/collection"
        className="island-kicker rise-in mb-8 inline-flex items-center gap-1.5 no-underline"
      >
        ← Collection
      </Link>

      {!release ? (
        <p className="text-(--sea-ink-soft)">Release not found.</p>
      ) : (
        <article
          className="island-shell rise-in relative overflow-hidden rounded-4xl px-6 py-10 sm:px-10 sm:py-14"
          style={{ animationDelay: '60ms' }}
        >
          <div className="pointer-events-none absolute -left-20 -top-24 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(79,184,178,0.32),transparent_66%)]" />
          <div className="pointer-events-none absolute -bottom-20 -right-20 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(47,106,74,0.18),transparent_66%)]" />

          <div className="relative flex flex-col gap-8 sm:flex-row sm:items-start">
            <CoverArt
              releaseId={String(release.id)}
              artist={release.basic_information.artists[0]?.name ?? ''}
              title={release.basic_information.title}
              thumb={release.basic_information.thumb}
              styles={release.basic_information.styles}
              className="w-full sm:w-72 aspect-square shrink-0 rounded-2xl overflow-hidden"
            />

            <div className="flex flex-col gap-4">
              <p className="island-kicker">
                {formatArtists(release.basic_information.artists)}
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
                  <dd>{formatDateAdded(release.date_added)}</dd>
                </div>
              </dl>

              <div className="mt-6 flex gap-3">
                <Button
                  variant="destructive"
                  className="rounded-full"
                  disabled={removeFromCollection.isPending}
                  onClick={() =>
                    removeFromCollection.mutate(release.id, {
                      onSuccess: () =>
                        navigate({
                          to: from === 'wantlist' ? '/wantlist' : '/collection',
                        }),
                    })
                  }
                >
                  <Library className="h-4 w-4" />
                  Remove from collection
                </Button>
              </div>
            </div>
          </div>
        </article>
      )}
    </main>
  )
}

export const Route = createFileRoute('/_authenticated/collection_/$id')({
  validateSearch: z.object({
    from: z.enum(['collection', 'wantlist']).optional(),
  }),
  loader: ({ context: { queryClient } }) =>
    queryClient.prefetchInfiniteQuery(collectionQueryOptions),
  component: RecordDetail,
})
