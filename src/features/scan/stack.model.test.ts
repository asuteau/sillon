import { describe, expect, it } from 'vitest'

import type { Pressing, Stack } from './stack.model'
import {
  EMPTY_STACK,
  lookedUp,
  lookupFailed,
  recordsToAdd,
  removeRecord,
  scanBarcode,
  stackSummary,
  toggleIncluded,
} from './stack.model'

const pressing = (id: number, overrides: Partial<Pressing> = {}): Pressing => ({
  id,
  masterId: null,
  artist: 'Slowdive',
  credits: ['Slowdive'],
  title: 'Souvlaki',
  year: 1993,
  country: 'UK',
  label: 'Creation Records',
  catno: 'CRE LP 139',
  format: 'Vinyl, LP, Album',
  inCollection: false,
  inWantlist: false,
  ...overrides,
})

const scanned = (...barcodes: string[]): Stack =>
  barcodes.reduce((stack, b) => scanBarcode(stack, b).stack, EMPTY_STACK)

describe('scanning a barcode', () => {
  it('puts it on top of the Stack while it is looked up', () => {
    const first = scanBarcode(EMPTY_STACK, '111').stack
    const { stack, outcome } = scanBarcode(first, '222')

    expect(outcome).toBe('new')
    expect(stack.records.map((r) => [r.barcode, r.status])).toEqual([
      ['222', 'looking-up'],
      ['111', 'looking-up'],
    ])
  })

  it('never adds a barcode already in the Stack twice', () => {
    const once = scanBarcode(EMPTY_STACK, '111').stack
    const { stack, outcome } = scanBarcode(once, '111')

    expect(outcome).toBe('repeat')
    expect(stack).toBe(once)
  })
})

describe('looking a barcode up', () => {
  it('makes a single matching Release ready to add', () => {
    const stack = lookedUp(scanned('111'), '111', [pressing(1)])

    expect(stack.records[0]).toMatchObject({
      barcode: '111',
      status: 'found',
      chosenId: 1,
    })
    expect(stackSummary(stack, 'collection')).toEqual({
      toAdd: 1,
      alreadyIn: 0,
      unresolved: 0,
      notFound: 0,
    })
  })

  it("takes a barcode Discogs doesn't know off the Stack and counts it", () => {
    const stack = lookedUp(scanned('111', '222'), '111', [])

    expect(stack.records.map((r) => r.barcode)).toEqual(['222'])
    expect(stackSummary(stack, 'collection').notFound).toBe(1)
  })

  it("tells a repeat of a barcode Discogs doesn't know apart", () => {
    const stack = lookedUp(scanned('111'), '111', [])

    const { stack: next, outcome } = scanBarcode(stack, '111')
    expect(outcome).toBe('not-found')
    expect(stackSummary(next, 'collection').notFound).toBe(1)
  })
})

describe('records already in the list', () => {
  const stack = lookedUp(
    lookedUp(scanned('111', '222'), '111', [
      pressing(1, { inCollection: true }),
    ]),
    '222',
    [pressing(2, { inWantlist: true })],
  )

  it('are left out of what confirming adds', () => {
    expect(stackSummary(stack, 'collection')).toMatchObject({
      toAdd: 1,
      alreadyIn: 1,
    })
    expect(recordsToAdd(stack, 'collection').map((r) => r.pressing.id)).toEqual(
      [2],
    )
  })

  it('depend on the list the Stack goes to', () => {
    expect(recordsToAdd(stack, 'wantlist').map((r) => r.pressing.id)).toEqual([
      1,
    ])
  })

  it('can be included anyway, for a second Copy', () => {
    const included = toggleIncluded(stack, '111')

    expect(stackSummary(included, 'collection')).toMatchObject({
      toAdd: 2,
      alreadyIn: 0,
    })
    expect(
      stackSummary(toggleIncluded(included, '111'), 'collection'),
    ).toMatchObject({
      toAdd: 1,
    })
  })
})

describe('taking records off the Stack', () => {
  it('removes one record, wherever it is', () => {
    const stack = removeRecord(scanned('111', '222', '333'), '222')

    expect(stack.records.map((r) => r.barcode)).toEqual(['333', '111'])
  })
})

describe('a lookup that fails', () => {
  it('keeps the record, to look it up again', () => {
    const failed = lookupFailed(scanned('111'), '111')
    expect(failed.records[0].status).toBe('lookup-failed')

    const { stack, outcome } = scanBarcode(failed, '111')
    expect(outcome).toBe('retry')
    expect(stack.records[0].status).toBe('looking-up')
  })
})
