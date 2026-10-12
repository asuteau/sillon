// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import {
  discogsCollectionUrl,
  discogsSearchUrl,
  discogsWantlistUrl,
} from '#/shared/utils/discogs-urls'

import { DiscogsAttribution } from './DiscogsAttribution'

describe('DiscogsAttribution', () => {
  it('links "Data provided by Discogs" to the page holding the data', () => {
    render(<DiscogsAttribution href={discogsCollectionUrl('crate digger')} />)

    const link = screen.getByRole('link', { name: 'Data provided by Discogs' })
    expect(link.getAttribute('href')).toBe(
      'https://www.discogs.com/user/crate%20digger/collection',
    )
    expect(link.getAttribute('target')).toBe('_blank')
  })

  it('is a followed link', () => {
    render(<DiscogsAttribution href={discogsWantlistUrl('me')} />)

    const rel = screen.getByRole('link').getAttribute('rel') ?? ''
    expect(rel).toContain('noopener')
    expect(rel).not.toContain('nofollow')
  })
})

describe('discogs URLs', () => {
  it('builds the search page for a query and type', () => {
    expect(discogsSearchUrl('Kind of Blue & co', 'master')).toBe(
      'https://www.discogs.com/search/?q=Kind+of+Blue+%26+co&type=master',
    )
  })
})
