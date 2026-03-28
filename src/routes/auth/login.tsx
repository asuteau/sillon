import { createFileRoute, redirect } from '@tanstack/react-router'
import { initiateOAuth } from '#/features/auth/auth.api'

export const Route = createFileRoute('/auth/login')({
  loader: async () => {
    const authorizeUrl = await initiateOAuth()
    throw redirect({ href: authorizeUrl })
  },
  component: () => null,
})
