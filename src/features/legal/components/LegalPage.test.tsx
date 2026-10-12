// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Route } from '#/routes/legal'
import { DISCOGS_NOTICE } from '#/shared/utils/legal'

import { LegalPage } from './LegalPage'

describe('/legal', () => {
  it('opens for visitors and collectors alike', () => {
    expect(Route.options.beforeLoad).toBeUndefined()
    expect(Route.options.component).toBe(LegalPage)
  })

  it('has terms, privacy, notices and mentions légales to link to', () => {
    const { container } = render(<LegalPage />)

    for (const id of ['terms', 'privacy', 'notices', 'mentions'])
      expect(container.querySelector(`section#${id} h2`)).not.toBeNull()
  })

  it('shows the Discogs notice word for word', () => {
    render(<LegalPage />)

    expect(screen.getByText(DISCOGS_NOTICE)).toBeTruthy()
    expect(DISCOGS_NOTICE).toBe(
      'This application uses Discogs’ API but is not affiliated with, sponsored or endorsed by Discogs. ‘Discogs’ is a trademark of Zink Media, LLC.',
    )
  })

  it('credits Deezer in plain text, without its logo', () => {
    const { container } = render(<LegalPage />)

    expect(screen.getByText('Covers from Deezer.')).toBeTruthy()
    expect(container.querySelector('img, svg')).toBeNull()
  })
})
