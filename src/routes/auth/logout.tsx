import { createFileRoute } from '@tanstack/react-router'
import { logoutUser } from '#/features/auth/auth.api'

export const Route = createFileRoute('/auth/logout')({
  loader: () => logoutUser(),
  component: () => null,
})
