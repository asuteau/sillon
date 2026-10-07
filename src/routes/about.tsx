import { createFileRoute, redirect } from '@tanstack/react-router'

// Folded into the landing page's liner notes
export const Route = createFileRoute('/about')({
  beforeLoad: () => {
    throw redirect({ to: '/', hash: 'liner-notes' })
  },
})
