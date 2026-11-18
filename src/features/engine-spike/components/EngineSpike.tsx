import {
  lazy,
  Suspense,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react'

import { ThemeToggle } from '#/shared/components/ThemeToggle'

import { CRAFT_MS, STILL_MS } from '../craft.score'
import type { Framing } from '../craft.score'
import { LOOP_MS, createShotClock } from '../shot-clock'
import { DomShot } from './DomShot'
import { MotionShot } from './MotionShot'

// WebGL in its own chunk, so its weight is only paid when it is shown
const GlShot = lazy(() =>
  import('./GlShot').then((m) => ({ default: m.GlShot })),
)

type View = 'dom' | 'webgl' | 'both' | 'flat'

const VIEWS: Array<{ id: View; label: string }> = [
  { id: 'both', label: 'A + B' },
  { id: 'dom', label: 'A · DOM' },
  { id: 'webgl', label: 'B · WebGL' },
  { id: 'flat', label: 'Prior flat' },
]

const readParam = <T extends string>(
  name: string,
  values: T[],
  fallback: T,
) => {
  if (typeof window === 'undefined') return fallback
  const v = new URLSearchParams(window.location.search).get(name)
  return values.find((x) => x === v) ?? fallback
}

const Toggle = <T extends string>({
  value,
  options,
  onChange,
}: {
  value: T
  options: Array<{ id: T; label: string }>
  onChange: (v: T) => void
}) => (
  <div className="flex gap-1 text-sm">
    {options.map((o) => (
      <button
        key={o.id}
        type="button"
        aria-pressed={value === o.id}
        className="rounded border px-3 py-1 aria-pressed:bg-foreground aria-pressed:text-background"
        onClick={() => onChange(o.id)}
      >
        {o.label}
      </button>
    ))}
  </div>
)

// Reduced motion: one still, the disc out, nothing plays. `?t=` (ms) opens
// paused on that frame
const startClock = () => {
  const clock = createShotClock()
  const t = new URLSearchParams(window.location.search).get('t')
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    clock.pause()
    clock.seek(STILL_MS)
  } else if (t !== null) {
    clock.pause()
    clock.seek(Number(t))
  }
  return clock
}

// Dev-only page for the landing engine spike (#110). The craft round: the
// same ~10s shot in the DOM (A: CSS 3D + Motion) and in WebGL (B: three.js),
// on one clock, in 16:9 or ~4:5, either theme. `?view=` `&framing=` `&t=`
// (ms, paused) set it from the URL, for screenshots.
export const EngineSpike = () => {
  const [view, setView] = useState<View>(() =>
    readParam('view', ['dom', 'webgl', 'both', 'flat'], 'both'),
  )
  const [framing, setFraming] = useState<Framing>(() =>
    readParam('framing', ['wide', 'tall'], 'wide'),
  )
  const [clock] = useState(startClock)
  const playing = useSyncExternalStore(clock.subscribe, clock.playing)
  const scrub = useRef<HTMLInputElement>(null)
  const readout = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    // For the DevTools probes and screenshots
    Object.assign(window, { shotClock: clock })
    let raf = 0
    const tick = () => {
      const ms = clock.ms()
      if (scrub.current) scrub.current.value = String(Math.round(ms))
      if (readout.current)
        readout.current.textContent = `${(ms / 1000).toFixed(2)}s`
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [clock])

  const shot = (v: 'dom' | 'webgl') =>
    v === 'dom' ? (
      <DomShot key={`dom-${framing}`} framing={framing} clock={clock} />
    ) : (
      <Suspense
        fallback={
          <div
            className="w-full bg-background"
            style={{ aspectRatio: framing === 'wide' ? '16 / 9' : '4 / 5' }}
          />
        }
      >
        <GlShot key={`gl-${framing}`} framing={framing} clock={clock} />
      </Suspense>
    )

  return (
    <main className="mx-auto flex max-w-7xl flex-col gap-6 p-4 md:p-6">
      <header className="flex flex-wrap items-center gap-4">
        <h1 className="type-title">Engine spike: craft</h1>
        <ThemeToggle />
        <Toggle value={view} options={VIEWS} onChange={setView} />
        <Toggle
          value={framing}
          options={[
            { id: 'wide', label: '16:9' },
            { id: 'tall', label: '4:5' },
          ]}
          onChange={setFraming}
        />
      </header>
      <div className="flex items-center gap-3 text-sm">
        <button
          type="button"
          className="rounded border px-3 py-1"
          onClick={() => {
            if (playing) clock.pause()
            else clock.play()
          }}
        >
          {playing ? 'Pause' : 'Play'}
        </button>
        <input
          ref={scrub}
          type="range"
          min={0}
          max={LOOP_MS}
          defaultValue={0}
          className="flex-1"
          aria-label="Scrub the shot"
          onChange={(e) => {
            clock.pause()
            clock.seek(Number(e.currentTarget.value))
          }}
        />
        <span ref={readout} className="w-14 font-mono tabular-nums">
          0.00s
        </span>
        <span className="text-muted-foreground">
          of {CRAFT_MS / 1000}s + hold
        </span>
      </div>
      {view === 'flat' && (
        <section className="mx-auto w-full max-w-md">
          <MotionShot />
        </section>
      )}
      {view === 'both' && (
        <div
          className={
            framing === 'wide'
              ? 'grid gap-6 lg:grid-cols-2'
              : 'mx-auto grid w-full max-w-4xl gap-6 md:grid-cols-2'
          }
        >
          <section className="flex flex-col gap-2">
            <h2 className="text-sm font-medium">A · DOM: CSS 3D + Motion</h2>
            {shot('dom')}
          </section>
          <section className="flex flex-col gap-2">
            <h2 className="text-sm font-medium">B · WebGL: three.js / R3F</h2>
            {shot('webgl')}
          </section>
        </div>
      )}
      {(view === 'dom' || view === 'webgl') && (
        <section
          className={framing === 'wide' ? 'w-full' : 'mx-auto w-full max-w-md'}
        >
          {shot(view)}
        </section>
      )}
    </main>
  )
}
