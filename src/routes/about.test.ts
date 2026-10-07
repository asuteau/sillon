import { isRedirect } from '@tanstack/react-router'
import { describe, expect, it } from 'vitest'

import { Route } from './about'

const redirectFor = (user: { username: string } | null) => {
  let thrown: unknown
  try {
    // @ts-expect-error -- beforeLoad only reads the user from its context
    Route.options.beforeLoad?.({ context: { user } })
  } catch (error) {
    thrown = error
  }
  expect(isRedirect(thrown)).toBe(true)
  return isRedirect(thrown) ? thrown.options : null
}

describe('/about', () => {
  it('redirects to the liner notes on the landing page', () => {
    expect(redirectFor(null)).toMatchObject({ to: '/', hash: 'liner-notes' })
  })

  it('redirects home without the liner notes once signed in', () => {
    const options = redirectFor({ username: 'digger' })
    expect(options).toMatchObject({ to: '/' })
    expect(options?.hash).toBeUndefined()
  })
})
