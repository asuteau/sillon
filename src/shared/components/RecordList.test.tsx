// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { RecordList, RecordRow } from './RecordList'

describe('RecordRow', () => {
  it('sets title, artist and catalogue line in their type roles', () => {
    render(
      <RecordList>
        <li>
          <RecordRow
            media={<span data-testid="cover" />}
            title="Kind of Blue"
            artist="Miles Davis"
            meta="1959"
            onClick={() => {}}
          />
        </li>
      </RecordList>,
    )

    expect(screen.getByText('Kind of Blue').className).toMatch(/\btype-title\b/)
    expect(screen.getByText('Miles Davis').className).toMatch(/\btype-caps\b/)
    expect(screen.getByText('1959').className).toMatch(/\btype-catalogue\b/)
    expect(screen.getByTestId('cover')).toBeTruthy()
  })

  it('is a square, pressable row', () => {
    const onClick = vi.fn()
    render(<RecordRow media={null} title="Blue Train" onClick={onClick} />)

    const row = screen.getByRole('button', { name: /Blue Train/ })
    fireEvent.click(row)

    expect(onClick).toHaveBeenCalledOnce()
    expect(row.className).not.toMatch(/rounded-(lg|xl|2xl|full)\b/)
    expect(row.className).not.toMatch(/island-|feature-card|rise-in/)
  })

  it('omits artist and catalogue line when absent', () => {
    const { container } = render(
      <RecordRow media={null} title="Blue Train" onClick={() => {}} />,
    )

    expect(container.querySelector('.type-caps')).toBeNull()
    expect(container.querySelector('.type-catalogue')).toBeNull()
  })
})

describe('RecordList', () => {
  it('is a hairline-divided list', () => {
    render(
      <RecordList aria-busy>
        <li>a</li>
      </RecordList>,
    )

    const list = screen.getByRole('list')
    expect(list.className).toMatch(/\bdivide-y\b/)
    expect(list.getAttribute('aria-busy')).toBe('true')
  })
})
