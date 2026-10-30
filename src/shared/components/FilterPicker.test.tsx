// @vitest-environment jsdom
import { fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { FilterableRecord } from '#/shared/utils/list-filter'

import { FilterPickerBody } from './FilterPicker'

beforeEach(() => {
  vi.stubGlobal('matchMedia', () => ({
    matches: false,
    addEventListener: () => {},
    removeEventListener: () => {},
  }))
})

afterEach(() => {
  vi.unstubAllGlobals()
})

const NIRVANA = { id: 125246, name: 'Nirvana' }
const KORN = { id: 33285, name: 'Korn' }

let nextId = 1

const record = ({
  artists = [NIRVANA],
  styles = ['Grunge'],
  year = 1991,
}: {
  artists?: FilterableRecord['basic_information']['artists']
  styles?: string[]
  year?: number
} = {}): FilterableRecord => ({
  id: nextId++,
  date_added: '2021-03-01T10:00:00-08:00',
  basic_information: { year, styles, artists },
})

const RECORDS = [
  record(),
  record({ year: 1989 }),
  record({ artists: [KORN], styles: ['Nu Metal'], year: 1999 }),
]

const BODY = {
  list: 'collection' as const,
  read: { status: 'read' as const, records: RECORDS },
  filters: {},
  onFiltersChange: () => {},
  onRetry: () => {},
}

const section = (name: string) => screen.getByRole('group', { name })

const values = (name: string) =>
  within(section(name))
    .getAllByRole('button')
    .filter((button) => button.hasAttribute('aria-pressed'))
    .map((button) => button.textContent)

describe('FilterPickerBody', () => {
  it('shows the small reading state in place of the sections until the list is read', () => {
    render(
      <FilterPickerBody
        {...BODY}
        read={{ status: 'reading', read: 100, total: 250, requestsLeft: 2 }}
      />,
    )

    expect(screen.getByRole('progressbar')).toBeTruthy()
    expect(screen.queryByRole('group', { name: 'Style' })).toBeNull()
  })

  it('offers a retry when a page fails', () => {
    const onRetry = vi.fn()
    render(
      <FilterPickerBody
        {...BODY}
        read={{ status: 'failed', read: 100, total: 250, requestsLeft: 2 }}
        onRetry={onRetry}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(onRetry).toHaveBeenCalled()
  })

  it('lists four sections of values with their counts', () => {
    render(<FilterPickerBody {...BODY} />)

    expect(values('Artist')).toEqual(['Nirvana2', 'Korn1'])
    expect(values('Style')).toEqual(['Grunge2', 'Nu Metal1'])
    expect(values('Pressing decade')).toEqual(['1990s2', '1980s1'])
    expect(values('Added')).toEqual(['20213'])
  })

  it('narrows counts by the other active filters', () => {
    render(<FilterPickerBody {...BODY} filters={{ style: 'Grunge' }} />)

    expect(values('Artist')).toEqual(['Nirvana2'])
    expect(values('Pressing decade')).toEqual(['1990s1', '1980s1'])
  })

  it('picks a value, replacing that kind’s current one', () => {
    const onFiltersChange = vi.fn()
    render(
      <FilterPickerBody
        {...BODY}
        filters={{ style: 'Grunge', decade: 1990 }}
        onFiltersChange={onFiltersChange}
      />,
    )

    fireEvent.click(
      within(section('Style')).getByRole('button', { name: /Nu Metal/ }),
    )
    expect(onFiltersChange).toHaveBeenCalledWith({
      style: 'Nu Metal',
      decade: 1990,
    })
  })

  it('shows the active value pressed, and clears it on tap', () => {
    const onFiltersChange = vi.fn()
    render(
      <FilterPickerBody
        {...BODY}
        filters={{ style: 'Grunge', decade: 1990 }}
        onFiltersChange={onFiltersChange}
      />,
    )

    const active = within(section('Style')).getByRole('button', {
      name: /Grunge/,
    })
    expect(active.getAttribute('aria-pressed')).toBe('true')

    fireEvent.click(active)
    expect(onFiltersChange).toHaveBeenCalledWith({
      style: undefined,
      decade: 1990,
    })
  })

  it('searches artists by any name they are credited under', () => {
    render(
      <FilterPickerBody
        {...BODY}
        read={{
          status: 'read',
          records: [
            ...RECORDS,
            record({ artists: [{ id: 7, name: 'Sigur Rós' }] }),
            record({
              artists: [{ id: 8, name: 'The Beatles', anv: 'Beatles' }],
            }),
          ],
        }}
      />,
    )

    fireEvent.change(
      screen.getByRole('searchbox', { name: 'Search artists' }),
      {
        target: { value: 'ros' },
      },
    )
    expect(values('Artist')).toEqual(['Sigur Rós1'])

    fireEvent.change(
      screen.getByRole('searchbox', { name: 'Search artists' }),
      {
        target: { value: 'zzz' },
      },
    )
    expect(
      within(section('Artist')).getByText('No artist matches'),
    ).toBeTruthy()
  })

  it('shows the first artists, then all on demand', () => {
    const many = Array.from({ length: 30 }, (_, i) =>
      record({ artists: [{ id: 1000 + i, name: `Artist ${i}` }] }),
    )
    render(
      <FilterPickerBody
        {...BODY}
        read={{ status: 'read', records: [...RECORDS, ...many] }}
      />,
    )

    expect(values('Artist')).toHaveLength(5)
    fireEvent.click(screen.getByRole('button', { name: 'All 32 artists' }))
    expect(values('Artist')).toHaveLength(32)
  })

  it('shows the first values of every kind, then all on demand', () => {
    const many = Array.from({ length: 6 }, (_, i) =>
      record({ styles: [`Style ${i}`] }),
    )
    render(
      <FilterPickerBody
        {...BODY}
        read={{ status: 'read', records: [...RECORDS, ...many] }}
      />,
    )

    expect(values('Style')).toHaveLength(5)
    fireEvent.click(screen.getByRole('button', { name: 'All 8 styles' }))
    expect(values('Style')).toHaveLength(8)
    expect(
      within(section('Pressing decade')).queryByRole('button', {
        name: /^All /,
      }),
    ).toBeNull()
  })

  it('keeps the active value in view beyond the first ones', () => {
    const many = Array.from({ length: 6 }, (_, i) =>
      record({ styles: [`Style ${i}`] }),
    )
    render(
      <FilterPickerBody
        {...BODY}
        read={{ status: 'read', records: [...RECORDS, ...many] }}
        filters={{ style: 'Style 5' }}
      />,
    )

    expect(values('Style')).toContain('Style 51')
  })
})
