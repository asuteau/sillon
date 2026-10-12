import { useEffect } from 'react'

import { applyThemeMode, readThemeMode } from '#/shared/utils/theme'

// In auto mode, follows the OS theme while the app is open, on every screen
// (the ThemeToggle only lives at the Portrait's foot)
export const useFollowSystemTheme = () => {
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => {
      if (readThemeMode() === 'auto') applyThemeMode('auto')
    }
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])
}
