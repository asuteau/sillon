// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook } from '@testing-library/react'
import { createElement } from 'react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { CollectionRelease } from '#/features/collection/collection.schema'
import { prepareRandomPick } from '#/features/collection/collection.queries'

import { useRandomPick } from './use-random-pick'

vi.mock('#/features/collection/collection.queries', () => ({
  prepareRandomPick: vi.fn(),
}))
vi.mock('@tanstack/react-router', () => ({ useMatch: () => 'me' }))

const prepare = vi.mocked(prepareRandomPick)

const copy = (instanceId: number) =>
  ({ id: instanceId, instance_id: instanceId }) as unknown as CollectionRelease

const deferred = <T>() => {
  let resolve!: (value: T) => void
  let reject!: (error: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

const wrapper = ({ children }: { children: ReactNode }) =>
  createElement(QueryClientProvider, { client: new QueryClient() }, children)

const render = () => renderHook(() => useRandomPick(), { wrapper })

describe('useRandomPick', () => {
  beforeEach(() => {
    prepare.mockReset().mockResolvedValue(copy(9))
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('shows a pick only once it is whole', async () => {
    const first = deferred<CollectionRelease | null>()
    prepare.mockReturnValueOnce(first.promise).mockResolvedValue(copy(2))
    const { result } = render()

    act(() => void result.current.pick())
    expect(result.current.isPicking).toBe(true)
    expect(result.current.record).toBeUndefined()

    await act(async () => first.resolve(copy(1)))
    expect(result.current.record?.instance_id).toBe(1)
    expect(result.current.isPicking).toBe(false)
  })

  it('prepares the next pick, excluding the Copy on screen', async () => {
    prepare.mockResolvedValueOnce(copy(1)).mockResolvedValueOnce(copy(2))
    const { result } = render()

    await act(() => result.current.pick())
    expect(prepare).toHaveBeenCalledTimes(2)
    expect(prepare.mock.calls[1][1]).toMatchObject({ excludeInstanceId: 1 })

    await act(() => result.current.pick())
    expect(result.current.record?.instance_id).toBe(2)
  })

  it('draws for real when the prepared pick failed', async () => {
    prepare
      .mockResolvedValueOnce(copy(1))
      .mockRejectedValueOnce(new Error('rate limited'))
      .mockResolvedValueOnce(copy(3))
    const { result } = render()

    await act(() => result.current.pick())
    await act(() => result.current.pick())
    expect(result.current.record?.instance_id).toBe(3)
    expect(result.current.isError).toBe(false)
  })

  it('keeps the current record and reports a failed draw', async () => {
    prepare.mockResolvedValueOnce(copy(1)).mockRejectedValue(new Error('down'))
    const { result } = render()

    await act(() => result.current.pick())
    await act(() => result.current.pick())
    expect(result.current.record?.instance_id).toBe(1)
    expect(result.current.isError).toBe(true)
  })

  it('drops a pick still loading when closed', async () => {
    const pending = deferred<CollectionRelease | null>()
    prepare.mockReturnValueOnce(pending.promise)
    const { result } = render()

    act(() => void result.current.pick())
    act(() => result.current.close())
    await act(async () => pending.resolve(copy(1)))
    expect(result.current.record).toBeUndefined()
    expect(result.current.isPicking).toBe(false)
  })
})
