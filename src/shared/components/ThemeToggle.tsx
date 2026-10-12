import { Moon, Sun, SunMoon } from 'lucide-react'
import { useEffect, useState } from 'react'

import { buttonVariants } from '#/shared/components/ui/button'
import { applyThemeMode, readThemeMode } from '#/shared/utils/theme'
import type { ThemeMode } from '#/shared/utils/theme'

export const ThemeToggle = () => {
  const [mode, setMode] = useState<ThemeMode>('auto')

  // The stored mode is only readable once mounted (SSR)
  useEffect(() => {
    setMode(readThemeMode())
  }, [])

  const toggleMode = () => {
    const nextMode: ThemeMode =
      mode === 'light' ? 'dark' : mode === 'dark' ? 'auto' : 'light'
    setMode(nextMode)
    applyThemeMode(nextMode)
    window.localStorage.setItem('theme', nextMode)
  }

  const label =
    mode === 'auto'
      ? 'Theme mode: auto (system). Click to switch to light mode.'
      : `Theme mode: ${mode}. Click to switch mode.`

  return (
    <button
      type="button"
      onClick={toggleMode}
      aria-label={label}
      title={label}
      className={buttonVariants({ variant: 'outline', size: 'sm' })}
    >
      {mode === 'auto' ? <SunMoon /> : mode === 'dark' ? <Moon /> : <Sun />}
      {mode === 'auto' ? 'Auto' : mode === 'dark' ? 'Dark' : 'Light'}
    </button>
  )
}
