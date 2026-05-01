import {
  formatArtists,
  formatDateAdded,
} from '#/features/collection/collection.utils'
import { useRemoveFromWantlist } from '#/features/wantlist/wantlist.mutations'
import { wantlistQueryOptions } from '#/features/wantlist/wantlist.queries'
import { Button } from '#/shared/components/ui/button'
import { CoverArt } from '#/shared/components/CoverArt'
import { useSuspenseInfiniteQuery } from '@tanstack/react-query'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { Heart } from 'lucide-react'
import { z } from 'zod'

const WantDetail = () => {
  const { id } = Route.useParams()
  const { from } = Route.useSearch()
  const navigate = useNavigate()
  const removeFromWantlist = useRemoveFromWantlist()
  const { data } = useSuspenseInfiniteQuery(wantlistQueryOptions)
  const want = data.pages
    .flatMap((p) => p.wants)
    .find((w) => w.id === Number(id))

  return (
    <main className="page-wrap px-4 pb-24 sm:pb-8 pt-14">
      <Link
        to="/wantlist"
        className="island-kicker rise-in mb-8 inline-flex items-center gap-1.5 no-underline"
      >
        ← Wantlist
      </Link>

      {!want ? (
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
              releaseId={String(want.id)}
              artist={want.basic_information.artists[0]?.name ?? ''}
              title={want.basic_information.title}
              thumb={want.basic_information.thumb}
              styles={want.basic_information.styles}
              className="w-full sm:w-72 aspect-square shrink-0 rounded-2xl overflow-hidden"
            />

            <div className="flex flex-col gap-4">
              <p className="island-kicker">
                {formatArtists(want.basic_information.artists)}
              </p>
              <h1 className="display-title text-4xl font-bold tracking-tight text-(--sea-ink) sm:text-5xl">
                {want.basic_information.title}
              </h1>

              <dl className="mt-2 flex flex-col gap-2 font-mono text-sm text-(--sea-ink-soft)">
                {want.basic_information.year > 0 && (
                  <div className="flex gap-3">
                    <dt>Year</dt>
                    <dd>{want.basic_information.year}</dd>
                  </div>
                )}
                <div className="flex gap-3">
                  <dt>Added</dt>
                  <dd>{formatDateAdded(want.date_added)}</dd>
                </div>
              </dl>

              <div className="mt-6 flex gap-3">
                <Button
                  variant="destructive"
                  className="rounded-full"
                  disabled={removeFromWantlist.isPending}
                  onClick={() =>
                    removeFromWantlist.mutate(want.id, {
                      onSuccess: () =>
                        navigate({
                          to: from === 'collection' ? '/collection' : '/wantlist',
                        }),
                    })
                  }
                >
                  <Heart className="h-4 w-4" />
                  Remove from wantlist
                </Button>
              </div>
            </div>
          </div>
        </article>
      )}
    </main>
  )
}

export const Route = createFileRoute('/_authenticated/wantlist_/$id')({
  validateSearch: z.object({
    from: z.enum(['collection', 'wantlist']).optional(),
  }),
  loader: ({ context: { queryClient } }) =>
    queryClient.prefetchInfiniteQuery(wantlistQueryOptions),
  component: WantDetail,
})
