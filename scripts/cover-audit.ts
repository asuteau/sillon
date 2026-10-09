// Runs the Cover lookup over a Discogs collection export (Collection → Export,
// CSV with "Artist" and "Title" columns) and reports hits and House sleeves.
// Compare with an earlier run to eyeball every Cover a matching change swaps:
//   pnpm audit:covers export.csv after.json [before.json]
import { readFileSync, writeFileSync } from 'node:fs'

import { fetchDeezerCover } from '../src/services/deezer.server'
import { creditNames } from '../src/shared/utils/artist-name'

type Audit = Record<string, string | null>

// Deezer allows 50 requests per 5 seconds; a lookup makes up to four
const PAUSE_MS = 400

const parseCsv = (text: string): string[][] =>
  text
    .trim()
    .split(/\r?\n/)
    .map((line) =>
      [...line.matchAll(/("(?:[^"]|"")*"|[^,]*)(?:,|$)/g)]
        .map(([, cell]) => cell.replace(/^"|"$/g, '').replaceAll('""', '"'))
        .slice(0, -1),
    )

const readRecords = (path: string) => {
  const [header, ...rows] = parseCsv(readFileSync(path, 'utf8'))
  const artistCol = header.indexOf('Artist')
  const titleCol = header.indexOf('Title')
  if (artistCol < 0 || titleCol < 0)
    throw new Error('Expected "Artist" and "Title" columns')
  return rows.map((row) => ({ artist: row[artistCol], title: row[titleCol] }))
}

const [csvPath, outPath, beforePath] = process.argv.slice(2)
if (!csvPath || !outPath) {
  console.error('Usage: cover-audit <export.csv> <out.json> [before.json]')
  process.exit(1)
}

const audit: Audit = {}
for (const { artist, title } of readRecords(csvPath)) {
  const key = `${artist} – ${title}`
  if (key in audit) continue
  audit[key] = await fetchDeezerCover(creditNames(artist), title).catch(
    (error: unknown) => {
      console.warn(`${key}: ${String(error)}`)
      return null
    },
  )
  await new Promise((resolve) => setTimeout(resolve, PAUSE_MS))
}
writeFileSync(outPath, JSON.stringify(audit, null, 2))

const hits = Object.values(audit).filter(Boolean).length
const total = Object.keys(audit).length
console.log(`${hits}/${total} Covers, ${total - hits} House sleeves`)

if (beforePath) {
  const before = JSON.parse(readFileSync(beforePath, 'utf8')) as Audit
  for (const [key, src] of Object.entries(audit)) {
    if (!(key in before) || before[key] === src) continue
    const label =
      before[key] === null ? 'gained' : src === null ? 'lost' : 'swapped'
    console.log(`${label.padEnd(8)} ${key}\n         ${before[key]} → ${src}`)
  }
}
