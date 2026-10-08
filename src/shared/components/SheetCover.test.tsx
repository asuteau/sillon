// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { coverArtQueryOptions } from '#/features/collection/collection.queries'

import { SheetCover } from './SheetCover'

const RECORD = { coverKey: 'm:1', artist: 'Can', title: 'Tago Mago' }

class InView {
  constructor(private callback: IntersectionObserverCallback) {}
  observe() {
    this.callback(
      [{ isIntersecting: true } as IntersectionObserverEntry],
      this as unknown as IntersectionObserver,
    )
  }
  disconnect() {}
}

// Never in view, so the HD lookup stays pending
class NotInView {
  observe() {}
  disconnect() {}
}

const renderSheetCover = (queryClient: QueryClient) =>
  render(
    <QueryClientProvider client={queryClient}>
      <SheetCover {...RECORD} styles={[]} />
    </QueryClientProvider>,
  )

describe('SheetCover', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('shows no image while the HD Cover is still loading', () => {
    vi.stubGlobal('IntersectionObserver', NotInView)
    const { container } = renderSheetCover(new QueryClient())
    expect(container.querySelector('img')).toBeNull()
    expect(container.querySelector('[data-layout]')).toBeNull()
  })

  it('shows a House sleeve when Deezer has no Cover', () => {
    vi.stubGlobal('IntersectionObserver', InView)
    const queryClient = new QueryClient()
    queryClient.setQueryData(
      coverArtQueryOptions(RECORD.coverKey, RECORD.artist, RECORD.title)
        .queryKey,
      null,
    )
    const { container } = renderSheetCover(queryClient)
    expect(container.querySelector('img')).toBeNull()
    expect(container.querySelector('[data-layout]')).not.toBeNull()
  })
})
