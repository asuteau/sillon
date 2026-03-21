import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { handleOAuthCallback } from '#/lib/oauthFns'

export const Route = createFileRoute('/auth/callback')({
  validateSearch: z.object({
    oauth_token: z.string(),
    oauth_verifier: z.string(),
  }),
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) => handleOAuthCallback({ data: deps }),
  component: () => null,
})
