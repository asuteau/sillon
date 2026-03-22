import { createFileRoute } from '@tanstack/react-router'
import { logoutUser } from '#/services/discogs'

export const Route = createFileRoute('/auth/logout')({
  loader: () => logoutUser(),
  component: () => null,
})
