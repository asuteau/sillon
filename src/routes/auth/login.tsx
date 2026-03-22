import { createFileRoute, redirect } from '@tanstack/react-router'
import { initiateOAuth } from '#/services/discogs'

export const Route = createFileRoute('/auth/login')({
  loader: async () => {
    const authorizeUrl = await initiateOAuth()
    throw redirect({ href: authorizeUrl })
  },
  component: () => null,
})
