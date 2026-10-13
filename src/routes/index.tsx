import { recentAdditionsQueryOptions } from '#/features/collection/collection.queries'
import { RandomPickCard } from '#/features/collection/components/RandomPickCard'
import { RecentAdditions } from '#/features/collection/components/RecentAdditions'
import { LandingPage } from '#/features/landing/components/LandingPage'
import { ScanFab } from '#/shared/components/ScanFab'
import { useInfiniteQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { Page } from '#/shared/components/Page'

export { recentAdditionsQueryOptions }

export const Route = createFileRoute('/')({
  loader: async ({ context: { user, queryClient } }) => {
    // Left to the client, which may restore it from the device
    if (!user || typeof window === 'undefined') return null
    return queryClient.prefetchInfiniteQuery(recentAdditionsQueryOptions)
  },
  component: App,
})

function App() {
  const { user } = Route.useRouteContext()
  const { data } = useInfiniteQuery({
    ...recentAdditionsQueryOptions,
    enabled: !!user,
  })

  if (!user) return <LandingPage />

  // Home sits on the Sleeve pull's centre axis
  return (
    <Page className="text-center">
      <RecentAdditions records={data?.releases} username={user.username} />
      {data && data.releases.length > 0 && <RandomPickCard />}
      <ScanFab />
    </Page>
  )
}
