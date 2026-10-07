import { useSyncExternalStore } from 'react'

const subscribe = (onChange: () => void) => {
  document.addEventListener('visibilitychange', onChange)
  return () => document.removeEventListener('visibilitychange', onChange)
}

// False while the tab is hidden or the window minimised
export const usePageVisible = () =>
  useSyncExternalStore(
    subscribe,
    () => document.visibilityState === 'visible',
    () => true,
  )
