import { useRemoveFromCollection } from '#/features/collection/collection.mutations'
import { recentAdditionsQueryOptions } from '#/features/collection/collection.queries'
import type { CollectionRelease } from '#/features/collection/collection.schema'
import { formatDateAdded } from '#/features/collection/collection.utils'
import { RandomPickCard } from '#/features/collection/components/RandomPickCard'
import { RecordSpotlight } from '#/features/collection/components/RecordSpotlight'
import { RecordList } from '#/shared/components/RecordList'
import { ReleaseRow } from '#/features/collection/components/ReleaseRow'
import { LinerNotes } from '#/features/landing/components/LinerNotes'
import { LandingPage } from '#/features/landing/components/LandingPage'
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

  if (!user) return <LandingPage />

  return (
    <main className="mx-auto w-full max-w-270 px-4 pt-14 pb-32 sm:pb-8">
      <MetricsStrip username={user.username} />

      {data && data.releases.length > 0 && <RandomPickCard />}

      <h1 className="type-display mb-6 text-4xl text-foreground">
        Recent additions
      </h1>

      {!data || data.releases.length === 0 ? (
        <p className="text-muted-foreground">
          No records in your collection yet.
        </p>
      ) : (
        <RecordList>
          {data.releases.map((release) => (
            <li key={release.instance_id}>
              <ReleaseRow
                release={release}
                meta={formatDateAdded(release.date_added)}
                onClick={() => setSelected(release)}
              />
            </li>
          ))}
        </RecordList>
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

      {/* /about lands here too once signed in */}
      <LinerNotes />

      <ScanFab />
    </main>
  )
}
