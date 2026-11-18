import { STORY_MS } from './storyboard.score'

type Listener = () => void

// The storyboard's clock, looping over the film and a preview of its hold.
// The film's Motion animation follows its play/pause/seek events and
// otherwise runs on its own (WAAPI).
export const createStoryClock = () => {
  let origin = performance.now()
  let pausedAt: number | null = null
  const listeners = new Set<Listener>()
  const emit = () => listeners.forEach((l) => l())

  const ms = () => pausedAt ?? (performance.now() - origin) % STORY_MS

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
      const at = Math.min(Math.max(0, to), STORY_MS - 1)
      if (pausedAt === null) origin = performance.now() - at
      else pausedAt = at
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

export type StoryClock = ReturnType<typeof createStoryClock>
