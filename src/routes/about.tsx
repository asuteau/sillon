import { createFileRoute, redirect } from '@tanstack/react-router'

// Folded into the landing page's liner notes, which only visitors see
export const Route = createFileRoute('/about')({
  beforeLoad: ({ context: { user } }) => {
    if (user) throw redirect({ to: '/' })
    throw redirect({ to: '/', hash: 'liner-notes' })
  },
})
