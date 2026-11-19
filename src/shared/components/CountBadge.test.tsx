// @vitest-environment jsdom
import { act, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { CountBadge } from './CountBadge'

const animate = vi.fn()
let isReduced = false

beforeEach(() => {
  isReduced = false
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: isReduced && query.includes('reduce'),
    addEventListener: () => {},
    removeEventListener: () => {},
  }))
  animate.mockReset()
  animate.mockImplementation(() => ({
    finished: new Promise(() => {}),
    cancel: () => {},
  }))
  Object.defineProperty(Element.prototype, 'animate', {
    value: animate,
    configurable: true,
  })
})

afterEach(() => vi.unstubAllGlobals())

describe('CountBadge', () => {
  it('shows the count as one number to assistive tech', () => {
    render(<CountBadge count={12} />)
    expect(screen.getByRole('img', { name: '12' })).toBeTruthy()
  })

  it('renders nothing for no count or zero', () => {
    const { container, rerender } = render(<CountBadge count={undefined} />)
    expect(container.textContent).toBe('')
    rerender(<CountBadge count={0} />)
    expect(container.textContent).toBe('')
  })

  it('plays nothing on first show or when the profile first loads', () => {
    const { rerender } = render(<CountBadge count={undefined} />)
    rerender(<CountBadge count={40} />)
    expect(animate).not.toHaveBeenCalled()
  })

  it('slides only the digits that changed, on a change', () => {
    const { rerender } = render(<CountBadge count={12} />)
    rerender(<CountBadge count={13} />)
    // new digit in + old digit out
    expect(animate).toHaveBeenCalledTimes(2)
    expect(screen.getByRole('img', { name: '13' })).toBeTruthy()
  })

  it('fades in from zero', () => {
    const { rerender } = render(<CountBadge count={0} />)
    rerender(<CountBadge count={1} />)
    expect(animate).toHaveBeenCalledTimes(1)
  })

  it('stays mounted while fading out to zero', () => {
    const { container, rerender } = render(<CountBadge count={1} />)
    rerender(<CountBadge count={0} />)
    expect(container.textContent).toBe('1')
    expect(animate).toHaveBeenCalledTimes(1)
  })

  it('does not play when animated is off', () => {
    const { rerender } = render(<CountBadge count={12} animated={false} />)
    rerender(<CountBadge count={13} animated={false} />)
    expect(animate).not.toHaveBeenCalled()
  })

  it('swaps instantly under reduced motion', () => {
    isReduced = true
    const { container, rerender } = render(<CountBadge count={1} />)
    rerender(<CountBadge count={2} />)
    rerender(<CountBadge count={0} />)
    expect(animate).not.toHaveBeenCalled()
    expect(container.textContent).toBe('')
  })

  it('settles on the new number once the roll ends', async () => {
    animate.mockImplementation(() => ({
      finished: Promise.resolve(),
      cancel: () => {},
    }))
    const { container, rerender } = render(<CountBadge count={12} />)
    await act(async () => rerender(<CountBadge count={13} />))
    expect(container.textContent).toBe('13')
  })
})
