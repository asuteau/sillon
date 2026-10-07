import { useRemoveFromCollection } from '#/features/collection/collection.mutations'
import { recentAdditionsQueryOptions } from '#/features/collection/collection.queries'
import type { CollectionRelease } from '#/features/collection/collection.schema'
import { formatDateAdded } from '#/features/collection/collection.utils'
import { RandomPickCard } from '#/features/collection/components/RandomPickCard'
import { RecordSpotlight } from '#/features/collection/components/RecordSpotlight'
import { CoverArt } from '#/shared/components/CoverArt'
import { releaseCoverKey } from '#/shared/utils/cover-key'
import { MetricsStrip } from '#/features/profile/components/MetricsStrip'
import { ScanFab } from '#/shared/components/ScanFab'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'

export { recentAdditionsQueryOptions }

export const Route = createFileRoute('/')({
  loader: async ({ context: { user, queryClient } }) => {
    if (!user) return null
    return queryClient.prefetchQuery(recentAdditionsQueryOptions)
  },
  component: App,
})

function App() {
  const { user } = Route.useRouteContext()
  const { data } = useQuery({
    ...recentAdditionsQueryOptions,
    enabled: !!user,
  })
  const [selected, setSelected] = useState<CollectionRelease | null>(null)
  const removeFromCollection = useRemoveFromCollection()

  if (!user) {
    return (
      <main className="page-wrap px-4 pb-24 pt-14 sm:pb-8">
        <section className="island-shell rise-in relative overflow-hidden rounded-4xl px-6 py-16 sm:px-10 sm:py-24">
          <div className="pointer-events-none absolute -left-20 -top-24 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(79,184,178,0.32),transparent_66%)]" />
          <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(47,106,74,0.18),transparent_66%)]" />
          <p className="island-kicker mb-4">Your vinyl collection</p>
          <h1 className="display-title mb-6 max-w-2xl text-4xl leading-[1.02] font-bold tracking-tight text-(--sea-ink) sm:text-6xl">
            Every record you own, beautifully organized.
          </h1>
          <p className="mb-10 max-w-xl text-base text-(--sea-ink-soft) sm:text-lg">
            Sillon syncs your Discogs collection and pairs it with
            high-definition artwork from Deezer — all in one quiet,
            distraction-free place.
          </p>
          <a
            href="/auth/login"
            className="inline-block rounded-full border border-[rgba(50,143,151,0.4)] bg-[rgba(79,184,178,0.18)] px-7 py-3 text-base font-semibold text-(--lagoon-deep) no-underline transition hover:-translate-y-0.5 hover:bg-[rgba(79,184,178,0.3)]"
          >
            Connect with Discogs
          </a>
        </section>
      </main>
    )
  }

  return (
    <main className="page-wrap px-4 pb-32 pt-14 sm:pb-8">
      <MetricsStrip username={user.username} />

      {data && data.releases.length > 0 && <RandomPickCard />}

      <header className="mb-8">
        <h1 className="display-title text-4xl font-bold tracking-tight text-(--sea-ink)">
          Recently Added
        </h1>
      </header>

      {!data || data.releases.length === 0 ? (
        <p className="text-(--sea-ink-soft)">
          No records in your collection yet.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {data.releases.map((release, index) => (
            <li key={release.instance_id}>
              <button
                onClick={() => setSelected(release)}
                className="island-shell feature-card rise-in flex w-full items-center gap-4 rounded-2xl px-4 py-3 cursor-pointer text-left"
                style={{ animationDelay: `${index * 60}ms` }}
              >
                <CoverArt
                  coverKey={releaseCoverKey(
                    release.id,
                    release.basic_information.master_id,
                  )}
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
                    {formatDateAdded(release.date_added)}
                  </span>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      {selected && (
        <RecordSpotlight
          record={selected}
          onClose={() => setSelected(null)}
          onRemove={() =>
            removeFromCollection.mutate(
              {
                releaseId: selected.id,
                copy: {
                  instanceId: selected.instance_id,
                  folderId: selected.folder_id,
                },
              },
              {
                onSuccess: () => setSelected(null),
              },
            )
          }
          isRemoving={removeFromCollection.isPending}
        />
      )}

      <ScanFab />
    </main>
  )
}
