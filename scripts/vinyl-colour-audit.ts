// Parses the format note of every Release in a Discogs Collection and lists
// each distinct note with its Vinyl colour, then the words no rule knows, most
// frequent first: the ones to grow the vocabulary with.
//   DISCOGS_TOKEN=… pnpm audit:vinyl <username> out.json
// The Collection is private: use a personal access token from
// https://www.discogs.com/settings/developers. Without one, the app's consumer
// key from .env reads public Collections only.
import { writeFileSync } from 'node:fs'
import { z } from 'zod'

import { CollectionReleaseSchema } from '../src/features/collection/collection.schema'
import {
  unrecognisedWords,
  vinylColour
  
} from '../src/features/collection/vinyl-colour.utils'
import type {VinylColour} from '../src/features/collection/vinyl-colour.utils';

// Only the formats: someone else's public Collection has no folder_id
const PageSchema = z.object({
  releases: z.array(
    z.object({
      basic_information: z.object({
        formats: CollectionReleaseSchema.shape.basic_information.shape.formats,
      }),
    }),
  ),
  pagination: z.object({ pages: z.number() }),
})

// Discogs allows 60 authenticated requests a minute
const PAUSE_MS = 1100

const [username, outPath] = process.argv.slice(2)
if (!username || !outPath) {
  console.error('Usage: vinyl-colour-audit <username> <out.json>')
  process.exit(1)
}

const { DISCOGS_TOKEN, DISCOGS_CONSUMER_KEY, DISCOGS_CONSUMER_SECRET } =
  process.env
const auth = DISCOGS_TOKEN
  ? `Discogs token=${DISCOGS_TOKEN}`
  : `Discogs key=${DISCOGS_CONSUMER_KEY}, secret=${DISCOGS_CONSUMER_SECRET}`

const readPage = async (page: number) => {
  const response = await fetch(
    `https://api.discogs.com/users/${encodeURIComponent(username)}/collection/folders/0/releases?per_page=100&page=${page}`,
    {
      headers: { Authorization: auth, 'User-Agent': 'Sillon/1.0 vinyl-audit' },
    },
  )
  if (!response.ok)
    throw new Error(`Discogs ${response.status}: ${await response.text()}`)
  return PageSchema.parse(await response.json())
}

const audit: Record<string, VinylColour & { unrecognised: string[] }> = {}
const wordCounts = new Map<string, number>()
let releases = 0

for (let page = 1, pages = 1; page <= pages; page++) {
  const result = await readPage(page)
  pages = result.pagination.pages
  for (const { basic_information } of result.releases) {
    releases++
    const formats = basic_information.formats
    const note = formats.find((format) => format.name === 'Vinyl')?.text ?? ''
    if (note in audit) continue
    const unrecognised = unrecognisedWords(note)
    audit[note] = { ...vinylColour(formats), unrecognised }
    for (const word of unrecognised)
      wordCounts.set(word, (wordCounts.get(word) ?? 0) + 1)
  }
  console.log(`page ${page}/${pages}`)
  if (page < pages)
    await new Promise((resolve) => setTimeout(resolve, PAUSE_MS))
}
writeFileSync(outPath, JSON.stringify(audit, null, 2))

const coloured = Object.values(audit).filter(
  ({ effect, colours }) => effect !== 'solid' || colours[0].family !== 'black',
).length
console.log(
  `${releases} Releases, ${Object.keys(audit).length} distinct notes, ${coloured} read as coloured`,
)
console.log('\nUnrecognised words (distinct notes):')
for (const [word, count] of [...wordCounts].sort((a, b) => b[1] - a[1]))
  console.log(`${String(count).padStart(4)}  ${word}`)
