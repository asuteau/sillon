import { useEffect, useRef, useState, useSyncExternalStore } from 'react'

import { ThemeToggle } from '#/shared/components/ThemeToggle'
import { cn } from '#/shared/utils/cn'

import { createStoryClock } from '../story-clock'
import { BEATS, FILM_MS, STORY_MS } from '../storyboard.score'
import type { Framing } from '../storyboard.score'
import { StoryboardFilm } from './StoryboardFilm'

type View = Framing | 'both'

const params = () =>
  typeof window === 'undefined'
    ? new URLSearchParams()
    : new URLSearchParams(window.location.search)

const readParam = <T extends string>(name: string, values: T[], fallback: T) =>
  values.find((x) => x === params().get(name)) ?? fallback

// `?t=` (ms) opens paused on that frame
const startClock = () => {
  const clock = createStoryClock()
  const t = params().get('t')
  if (t !== null) {
    clock.pause()
    clock.seek(Number(t))
  }
  return clock
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
        className="rounded-full border px-3 py-1 aria-pressed:bg-foreground aria-pressed:text-background"
        onClick={() => onChange(o.id)}
      >
        {o.label}
      </button>
    ))}
  </div>
)

// Where the page's headline sits over the film, to judge the composition.
// Not part of the film
const Headline = ({ framing }: { framing: Framing }) => (
  <div
    className={cn(
      'pointer-events-none flex flex-col gap-3 rounded-[2px] border border-dashed border-foreground/25 p-3',
      framing === 'wide'
        ? 'absolute top-[16%] left-[5%] w-[34%]'
        : 'mb-4 w-full',
    )}
  >
    <span className="type-caps text-[10px] text-muted-foreground">
      Headline (placeholder, not in the film)
    </span>
    <span
      className={cn(
        'type-display text-balance text-foreground',
        framing === 'wide' ? 'text-[clamp(28px,3.6vw,56px)]' : 'text-4xl',
      )}
    >
      Your Discogs collection, cover first.
    </span>
    <span className="h-9 w-48 rounded-full bg-foreground/15" />
  </div>
)

const Stage = ({
  framing,
  clock,
  headline,
}: {
  framing: Framing
  clock: ReturnType<typeof createStoryClock>
  headline: boolean
}) => (
  <section
    className={framing === 'wide' ? 'w-full' : 'mx-auto w-full max-w-md'}
  >
    {headline && framing === 'tall' && <Headline framing="tall" />}
    <StoryboardFilm framing={framing} clock={clock}>
      {headline && framing === 'wide' && <Headline framing="wide" />}
    </StoryboardFilm>
  </section>
)

// Dev-only storyboard of the landing hero film (#114): the full film on one
// clock, scrubbable, beat by beat, in 16:9 and ~4:5, either theme.
// `?framing=wide|tall|both&t=<ms>&headline=0` set it from the URL.
export const StoryboardSpike = () => {
  const [view, setView] = useState<View>(() =>
    readParam('framing', ['wide', 'tall', 'both'], 'wide'),
  )
  const [headline, setHeadline] = useState(
    () => params().get('headline') !== '0',
  )
  const [clock] = useState(startClock)
  const playing = useSyncExternalStore(clock.subscribe, clock.playing)
  const scrub = useRef<HTMLInputElement>(null)
  const readout = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    Object.assign(window, { storyClock: clock })
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

  // `?shot=1`: the film alone over the page, for key frames
  if (params().get('shot') === '1' && view !== 'both') {
    return (
      <div className="fixed inset-0 z-100 flex items-center justify-center bg-background">
        <div
          className={
            view === 'wide'
              ? 'w-[min(100vw,calc(100vh*16/9))]'
              : 'w-[min(100vw,calc(100vh*4/5))]'
          }
        >
          <StoryboardFilm framing={view} clock={clock}>
            {headline && view === 'wide' && <Headline framing="wide" />}
          </StoryboardFilm>
        </div>
      </div>
    )
  }

  return (
    <main className="mx-auto flex max-w-7xl flex-col gap-5 p-4 md:p-6">
      <header className="flex flex-wrap items-center gap-3">
        <h1 className="type-title mr-auto">Hero film storyboard</h1>
        <Toggle
          value={view}
          options={[
            { id: 'wide', label: '16:9' },
            { id: 'tall', label: '4:5' },
            { id: 'both', label: 'Both' },
          ]}
          onChange={setView}
        />
        <button
          type="button"
          aria-pressed={headline}
          className="rounded-full border px-3 py-1 text-sm aria-pressed:bg-foreground aria-pressed:text-background"
          onClick={() => setHeadline((h) => !h)}
        >
          Headline
        </button>
        <ThemeToggle />
      </header>

      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-3 text-sm">
          <button
            type="button"
            className="w-16 rounded-full border px-3 py-1"
            onClick={() => (playing ? clock.pause() : clock.play())}
          >
            {playing ? 'Pause' : 'Play'}
          </button>
          <div className="relative flex-1">
            <input
              ref={scrub}
              type="range"
              min={0}
              max={STORY_MS - 1}
              defaultValue={0}
              className="w-full accent-foreground"
              aria-label="Scrub the film"
              onChange={(e) => {
                clock.pause()
                clock.seek(Number(e.currentTarget.value))
              }}
            />
          </div>
          <span
            ref={readout}
            className="w-14 text-right type-catalogue tabular-nums"
          >
            0.00s
          </span>
        </div>
        {/* Beat markers: click to jump to a beat's start */}
        <div className="relative ml-[76px] mr-[68px] h-10">
          {BEATS.map((beat) => (
            <button
              key={beat.id}
              type="button"
              className="absolute top-0 flex h-full flex-col items-start border-l border-foreground/40 pl-1.5 text-left hover:bg-foreground/5"
              style={{
                left: `${((beat.from * 1000) / STORY_MS) * 100}%`,
                width: `${(((beat.to - beat.from) * 1000) / STORY_MS) * 100}%`,
              }}
              onClick={() => {
                clock.pause()
                clock.seek(beat.from * 1000)
              }}
            >
              <span className="type-caps text-[10px] text-foreground">
                {beat.label}
              </span>
              <span className="type-catalogue text-[10px] text-muted-foreground">
                {beat.from}–{beat.to}s
              </span>
            </button>
          ))}
          <span
            className="absolute top-0 flex h-full flex-col border-l border-dashed border-foreground/40 pl-1.5"
            style={{ left: `${(FILM_MS / STORY_MS) * 100}%` }}
          >
            <span className="type-caps text-[10px] text-muted-foreground">
              Ambient hold
            </span>
            <span className="type-catalogue text-[10px] text-muted-foreground">
              16s → ∞
            </span>
          </span>
        </div>
      </div>

      {view === 'both' ? (
        <div className="grid items-start gap-6 lg:grid-cols-[1.9fr_1fr]">
          <Stage framing="wide" clock={clock} headline={headline} />
          <Stage framing="tall" clock={clock} headline={headline} />
        </div>
      ) : (
        <Stage key={view} framing={view} clock={clock} headline={headline} />
      )}
    </main>
  )
}
