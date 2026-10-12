import { createFileRoute } from '@tanstack/react-router'

import { collectionValueQueryOptions } from '#/features/collection/collection.queries'
import { PortraitPage } from '#/features/portrait/components/PortraitPage'
import { profileQueryOptions } from '#/features/profile/profile.queries'
import { Page } from '#/shared/components/Page'

export const Route = createFileRoute('/_authenticated/portrait')({
  loader: ({ context: { queryClient, user } }) => {
    if (!user) return
    // The value may be slow; only the profile holds the page
    void queryClient.prefetchQuery(collectionValueQueryOptions(user.username))
    return queryClient.ensureQueryData(profileQueryOptions(user.username))
  },
  component: () => <Portrait />,
})

const Portrait = () => {
  const { user } = Route.useRouteContext()
  if (!user) return null

  return (
    <Page>
      <PortraitPage username={user.username} />
    </Page>
  )
}
