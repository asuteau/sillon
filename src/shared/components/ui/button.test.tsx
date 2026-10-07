// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Button, buttonVariants } from './button'

const SIZES = [
  'default',
  'xs',
  'sm',
  'lg',
  'icon',
  'icon-xs',
  'icon-sm',
  'icon-lg',
] as const

const VARIANTS = [
  'default',
  'outline',
  'secondary',
  'ghost',
  'destructive',
  'link',
  'lacquer',
] as const

describe('buttonVariants', () => {
  it.each(SIZES)('size %s is fully round', (size) => {
    const classes = buttonVariants({ size }).split(' ')
    expect(classes).toContain('rounded-full')
    expect(classes.filter((c) => /^rounded-(?!full)/.test(c))).toEqual([])
  })

  it.each(VARIANTS)('variant %s has no press bounce', (variant) => {
    expect(buttonVariants({ variant })).not.toMatch(/translate-y/)
  })

  it('default is solid foreground', () => {
    expect(buttonVariants()).toMatch(/\bbg-primary\b/)
    expect(buttonVariants()).toMatch(/\btext-primary-foreground\b/)
  })

  it('lacquer uses the lacquer gradient with dark text', () => {
    const classes = buttonVariants({ variant: 'lacquer' })
    expect(classes).toMatch(/bg-\(image:--lacquer\)/)
    expect(classes).toMatch(/\btext-lacquer-foreground\b/)
  })

  it('fades over 160ms with the fade easing', () => {
    const classes = buttonVariants()
    expect(classes).toMatch(/\bduration-160\b/)
    expect(classes).toMatch(/\bease-fade\b/)
  })
})

describe('Button', () => {
  it('renders a lacquer button', () => {
    render(<Button variant="lacquer">Connect with Discogs</Button>)
    const button = screen.getByRole('button', { name: 'Connect with Discogs' })
    expect(button.className).toMatch(/text-lacquer-foreground/)
  })
})
