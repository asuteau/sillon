import { createFileRoute } from '@tanstack/react-router'

import { LegalPage } from '#/features/legal/components/LegalPage'

// Public, signed in or not: no redirect, unlike /about
export const Route = createFileRoute('/legal')({
  head: () => ({ meta: [{ title: 'Legal · Sillon' }] }),
  component: LegalPage,
})
