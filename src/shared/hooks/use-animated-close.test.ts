// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useAnimatedClose } from './use-animated-close'

describe('useAnimatedClose', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('calls onClose after the exit animation when closed programmatically', () => {
    const onClose = vi.fn()
    const { result } = renderHook(() => useAnimatedClose(onClose))

    act(() => result.current.close())
    expect(result.current.open).toBe(false)
    expect(onClose).not.toHaveBeenCalled()

    act(() => vi.advanceTimersByTime(500))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose once when the drawer also reports animation end', () => {
    const onClose = vi.fn()
    const { result } = renderHook(() => useAnimatedClose(onClose))

    act(() => result.current.onOpenChange(false))
    act(() => result.current.onAnimationEnd(false))
    act(() => vi.advanceTimersByTime(500))

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('ignores animation end of an opening transition', () => {
    const onClose = vi.fn()
    const { result } = renderHook(() => useAnimatedClose(onClose))

    act(() => result.current.onAnimationEnd(true))
    act(() => vi.advanceTimersByTime(500))

    expect(onClose).not.toHaveBeenCalled()
  })
})
