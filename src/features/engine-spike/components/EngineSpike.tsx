import { useState } from 'react'

import { ThemeToggle } from '#/shared/components/ThemeToggle'

import { MotionShot } from './MotionShot'
import { RemotionShot } from './RemotionShot'

type View = 'both' | 'motion' | 'remotion'

const VIEWS: View[] = ['both', 'motion', 'remotion']

// Dev-only page for the landing engine spike (#110): the same ~10s shot in
// Motion and in Remotion, side by side or one at a time, in either theme.
// The Remotion Studio opens the same composition: `pnpm spike:remotion`.
export const EngineSpike = () => {
  const [view, setView] = useState<View>('both')
  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 p-6">
      <header className="flex flex-wrap items-center gap-4">
        <h1 className="type-title">Engine spike: Motion vs Remotion</h1>
        <ThemeToggle />
        <div className="flex gap-2 text-sm">
          {VIEWS.map((v) => (
            <button
              key={v}
              type="button"
              aria-pressed={view === v}
              className="rounded border px-3 py-1 aria-pressed:bg-foreground aria-pressed:text-background"
              onClick={() => setView(v)}
            >
              {v}
            </button>
          ))}
        </div>
      </header>
      <div
        className={
          view === 'both'
            ? 'grid gap-6 md:grid-cols-2'
            : 'mx-auto w-full max-w-md'
        }
      >
        {view !== 'remotion' && (
          <section className="flex flex-col gap-2">
            <h2 className="text-sm font-medium">Motion · animate() / WAAPI</h2>
            <MotionShot />
          </section>
        )}
        {view !== 'motion' && (
          <section className="flex flex-col gap-2">
            <h2 className="text-sm font-medium">
              Remotion · @remotion/player, 60 fps
            </h2>
            <RemotionShot />
          </section>
        )}
      </div>
    </main>
  )
}
