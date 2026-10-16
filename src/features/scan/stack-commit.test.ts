import { describe, expect, it } from 'vitest'

import { commitStack } from './stack-commit'
import type { CommitEvent } from './stack-commit'
import type { ReleaseMatch, StackEntry } from './stack.model'

const entry = (barcode: string): StackEntry => {
  const release: ReleaseMatch = {
    id: Number(barcode),
    masterId: null,
    artist: 'Slowdive',
    credits: ['Slowdive'],
    title: 'Souvlaki',
    year: 1993,
    country: null,
    label: null,
    catno: null,
    format: null,
    inCollection: false,
    inWantlist: false,
  }
  return { barcode, release }
}

describe('confirming a Stack', () => {
  it('adds records one after another, oldest scanned first', async () => {
    const log: string[] = []
    let running = 0

    const result = await commitStack({
      // Newest first, as the Stack lists them
      entries: [entry('3'), entry('2'), entry('1')],
      add: async ({ barcode }) => {
        running++
        expect(running).toBe(1)
        log.push(barcode)
        await Promise.resolve()
        running--
        return { status: 'added' as const, barcode }
      },
    })

    expect(log).toEqual(['1', '2', '3'])
    expect(result.added.map((a) => a.entry.barcode)).toEqual(['1', '2', '3'])
    expect(result.failed).toEqual([])
  })

  it('carries on past a record that fails, and keeps it', async () => {
    const events: CommitEvent[] = []

    const result = await commitStack({
      entries: [entry('2'), entry('1')],
      add: ({ barcode }) =>
        barcode === '1'
          ? Promise.reject(new Error('500'))
          : Promise.resolve({ status: 'added' as const }),
      onEvent: (event) => events.push(event),
    })

    expect(result.added.map((a) => a.entry.barcode)).toEqual(['2'])
    expect(result.failed.map((f) => f.barcode)).toEqual(['1'])
    expect(events).toEqual([
      { type: 'adding', barcode: '1' },
      { type: 'failed', barcode: '1' },
      { type: 'adding', barcode: '2' },
      { type: 'added', barcode: '2' },
    ])
  })
})

describe('confirming a Stack while Discogs throttles', () => {
  it('pauses and carries on by itself, without losing the record', async () => {
    const events: CommitEvent[] = []
    const waits: number[] = []
    const answers = ['throttled', 'throttled', 'added', 'added']

    const result = await commitStack({
      entries: [entry('2'), entry('1')],
      add: () => Promise.resolve(answers.shift()),
      isThrottled: (answer) => answer === 'throttled',
      wait: (ms) => {
        waits.push(ms)
        return Promise.resolve()
      },
      onEvent: (event) => events.push(event),
    })

    expect(result.added.map((a) => a.entry.barcode)).toEqual(['1', '2'])
    expect(result.failed).toEqual([])
    expect(waits).toHaveLength(2)
    expect(events).toEqual([
      { type: 'adding', barcode: '1' },
      { type: 'paused' },
      { type: 'paused' },
      { type: 'resumed' },
      { type: 'added', barcode: '1' },
      { type: 'adding', barcode: '2' },
      { type: 'added', barcode: '2' },
    ])
  })

  it('gives a record up after a minute and more of throttling', async () => {
    const waits: number[] = []

    const result = await commitStack({
      entries: [entry('1')],
      add: () => Promise.resolve('throttled'),
      isThrottled: (answer) => answer === 'throttled',
      wait: (ms) => {
        waits.push(ms)
        return Promise.resolve()
      },
    })

    expect(result.failed.map((f) => f.barcode)).toEqual(['1'])
    expect(waits.reduce((a, b) => a + b, 0)).toBeGreaterThan(60_000)
  })
})
