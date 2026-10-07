import { isRedirect } from '@tanstack/react-router'
import { describe, expect, it } from 'vitest'

import { Route } from './about'

describe('/about', () => {
  it('redirects to the colophon on the landing page', () => {
    let thrown: unknown
    try {
      // @ts-expect-error -- beforeLoad ignores its context here
      Route.options.beforeLoad?.({})
    } catch (error) {
      thrown = error
    }
    expect(isRedirect(thrown)).toBe(true)
    if (!isRedirect(thrown)) return
    expect(thrown.options).toMatchObject({ to: '/', hash: 'colophon' })
  })
})
