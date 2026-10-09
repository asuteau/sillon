import { readFileSync, writeFileSync } from 'node:fs'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

import { fetchDeezerCover } from './deezer.server'

// Deezer answers recorded once, replayed offline. To refresh them, or record
// the answers a new case needs: DEEZER_RECORD=1 pnpm test deezer
const FIXTURES = new URL('./__fixtures__/deezer-search.json', import.meta.url)
const RECORD = process.env.DEEZER_RECORD === '1'

type Recorded = Record<string, unknown>
const recorded: Recorded = JSON.parse(readFileSync(FIXTURES, 'utf8'))
const realFetch = globalThis.fetch

const replay = async (input: string | URL | Request, init?: RequestInit) => {
  const url = new URL(input instanceof Request ? input.url : input)
  const q = url.searchParams.get('q')!
  if (RECORD && !(q in recorded)) {
    const json = (await (await realFetch(url, init)).json()) as {
      data: { title: string; artist: { name: string }; cover_xl: string }[]
    }
    // Only what matching reads, to keep the fixtures readable
    recorded[q] = {
      data: json.data.map(({ title, artist, cover_xl }) => ({
        title,
        artist: { name: artist.name },
        cover_xl,
      })),
    }
  }
  if (!(q in recorded)) throw new Error(`No recorded Deezer answer for ${q}`)
  return new Response(JSON.stringify(recorded[q]))
}

// The Deezer cover ID, or null for a House sleeve
const coverId = async (credits: string[], title: string) =>
  (await fetchDeezerCover(credits, title))?.match(/cover\/(\w+)\//)?.[1] ?? null

describe('fetchDeezerCover', () => {
  beforeAll(() => {
    vi.stubGlobal('fetch', vi.fn(replay))
  })

  afterAll(() => {
    vi.unstubAllGlobals()
    if (RECORD)
      writeFileSync(FIXTURES, JSON.stringify(recorded, null, 2) + '\n')
  })

  const TELEPATH = 'Telepath テレパシー能力者'

  it.each<[string, string[], string, string | null]>([
    // A wrong Cover is worse than a House sleeve
    [
      'rejects another album by the artist for a CJK title',
      ['t e l e p a t h テレパシー能力者', TELEPATH],
      '信仰',
      null,
    ],
    [
      'rejects a CJK album for a one-letter title',
      ['t e l e p a t h', TELEPATH],
      'A',
      null,
    ],
    [
      'gives a House sleeve to a record Deezer lacks',
      ['t e l e p a t h テレパシー能力者', TELEPATH],
      '永遠の愛',
      null,
    ],
    [
      'matches a CJK title character by character',
      ['t e l e p a t h テレパシー能力者', TELEPATH],
      'アンタラ通信',
      '9af52c6e7cce17991706131f43738dbe',
    ],
    [
      'finds a collaboration Deezer files under its Lead credit',
      ['Nmesh', 't e l e p a t h テレパシー能力者', TELEPATH],
      'ロストエデンへのパス',
      'f6af0b658285d0d9bf87811801d0f84a',
    ],
    [
      'reads a spaced-out name as one word',
      ['w i n t e r q u i l t'],
      "O'discordia",
      '80782bae47b6b7fb6ec68a7971906067',
    ],
    [
      'reads stylised Cyrillic letters as Latin',
      ['Korn'],
      'Follow The Leader',
      '35111a59f5d5ef0bf5a7ba2f3a203b25',
    ],
    [
      'accepts an artist named inside the credit',
      ["Claudio Simonetti's Goblin"],
      'Profondo Rosso',
      'e06d198fbd3902683e7d7a7379ee0f86',
    ],
    [
      'drops a soundtrack mention from the title',
      ['Goblin'],
      'Suspiria (Original Soundtrack)',
      '24ee786447a21425cf4c1e80936a7d20',
    ],
    [
      'folds accents and Latin letters such as æ',
      ['Sigur Rós'],
      'Ágætis Byrjun',
      '6f536b9aa9f7fa705801ff29a7d298bf',
    ],
    [
      'reads Roman numerals as numbers',
      ['Led Zeppelin'],
      'Led Zeppelin IV',
      '2047754dc07232def42ec26a9a854544',
    ],
    [
      'gives a House sleeve to an artist off streaming',
      ['Bruit ≤'],
      'The Machine Is Burning And Now Everyone Knows It Could Happen Again',
      null,
    ],
  ])('%s', async (_, credits, title, expected) => {
    expect(await coverId(credits, title)).toBe(expected)
  })
})
