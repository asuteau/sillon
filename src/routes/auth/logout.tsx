import { createFileRoute } from '@tanstack/react-router'
import { logoutUser } from '#/lib/oauthFns'

export const Route = createFileRoute('/auth/logout')({
  loader: () => logoutUser(),
  component: () => null,
})
