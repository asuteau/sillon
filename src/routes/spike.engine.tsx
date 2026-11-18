import { createFileRoute, notFound } from '@tanstack/react-router'
import { lazy, Suspense } from 'react'

// Landing engine spike (#110), dev only: the import is dead code in a
// production build, so neither engine reaches the bundle.
const EngineSpike = import.meta.env.DEV
  ? lazy(() =>
      import('#/features/engine-spike/components/EngineSpike').then((m) => ({
        default: m.EngineSpike,
      })),
    )
  : () => null

export const Route = createFileRoute('/spike/engine')({
  beforeLoad: () => {
    if (!import.meta.env.DEV) throw notFound()
  },
  component: () => (
    <Suspense>
      <EngineSpike />
    </Suspense>
  ),
})
