import { CRAFT_MS } from './craft.score'

// The hold after the shot, before it loops (the real film holds forever)
export const LOOP_HOLD_MS = 2_000
export const LOOP_MS = CRAFT_MS + LOOP_HOLD_MS

type Listener = () => void

// The page's clock: the DOM's Motion animation follows its play/pause/seek
// events and otherwise runs on its own (WAAPI).
export const createShotClock = () => {
  let origin = performance.now()
  let pausedAt: number | null = null
  const listeners = new Set<Listener>()
  const emit = () => listeners.forEach((l) => l())

  const ms = () =>
    (pausedAt ?? (performance.now() - origin + LOOP_MS) % LOOP_MS) % LOOP_MS

  return {
    ms,
    playing: () => pausedAt === null,
    play: () => {
      if (pausedAt === null) return
      origin = performance.now() - pausedAt
      pausedAt = null
      emit()
    },
    pause: () => {
      if (pausedAt !== null) return
      pausedAt = ms()
      emit()
    },
    seek: (to: number) => {
      if (pausedAt === null) origin = performance.now() - to
      else pausedAt = to
      emit()
    },
    restart: () => {
      origin = performance.now()
      if (pausedAt !== null) pausedAt = 0
      emit()
    },
    subscribe: (l: Listener) => {
      listeners.add(l)
      return () => {
        listeners.delete(l)
      }
    },
  }
}

export type ShotClock = ReturnType<typeof createShotClock>
