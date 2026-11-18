import { useSyncExternalStore } from 'react'

import type { HeroFraming } from '../hero/hero.score'

const WIDE = '(min-width: 768px)'

const subscribe = (onChange: () => void) => {
  const query = window.matchMedia(WIDE)
  query.addEventListener('change', onChange)
  return () => query.removeEventListener('change', onChange)
}

// The hero film's composition for the screen: 16:9 from tablet widths up,
// about 4:5 on phones. Null on the server and while hydrating: the screen
// isn't known yet, so the film's set is built once, for the right one
export const useHeroFraming = (): HeroFraming | null =>
  useSyncExternalStore(
    subscribe,
    () => (window.matchMedia(WIDE).matches ? 'wide' : 'tall'),
    () => null,
  )
