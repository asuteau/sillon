import { useSyncExternalStore } from 'react'

import type { HeroFraming } from '../hero/hero.score'

const WIDE = '(min-width: 768px)'

const subscribe = (onChange: () => void) => {
  const query = window.matchMedia(WIDE)
  query.addEventListener('change', onChange)
  return () => query.removeEventListener('change', onChange)
}

// The hero film's composition for the screen: 16:9 from tablet widths up,
// about 4:5 on phones. The server renders the phone's; the film fades up
// from the page ground, so the switch is never seen
export const useHeroFraming = (): HeroFraming =>
  useSyncExternalStore(
    subscribe,
    () => (window.matchMedia(WIDE).matches ? 'wide' : 'tall'),
    () => 'tall',
  )
