import { createFileRoute, notFound } from '@tanstack/react-router'
import { lazy, Suspense } from 'react'

// Hero film storyboard (#114), dev only: the import is dead code in a
// production build, so none of it reaches the bundle.
const StoryboardSpike = import.meta.env.DEV
  ? lazy(() =>
      import('#/features/storyboard-spike/components/StoryboardSpike').then(
        (m) => ({ default: m.StoryboardSpike }),
      ),
    )
  : () => null

export const Route = createFileRoute('/spike/storyboard')({
  // Client only: the film measures the page and reads the URL and theme
  ssr: false,
  beforeLoad: () => {
    if (!import.meta.env.DEV) throw notFound()
  },
  component: () => (
    <Suspense>
      <StoryboardSpike />
    </Suspense>
  ),
})
