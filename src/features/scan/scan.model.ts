import { creditNames, stripDisambiguator } from '#/shared/utils/artist-name'

import type { BarcodeMatch } from './scan.schema'
import type { ReleaseMatch } from './stack.model'

// Discogs titles search results "Artist - Title"
const splitTitle = (raw: string) => {
  const dash = raw.indexOf(' - ')
  return dash === -1
    ? { credit: '', title: raw }
    : { credit: raw.slice(0, dash), title: raw.slice(dash + 3) }
}

export const toReleaseMatch = (raw: BarcodeMatch): ReleaseMatch => {
  const { credit, title } = splitTitle(raw.title)
  const format = raw.formats?.at(0)
  const formatParts = format
    ? [format.name, ...(format.descriptions ?? []), format.text].filter(Boolean)
    : []
  const year = Number(raw.year)
  const catno =
    raw.catno && raw.catno.toLowerCase() !== 'none' ? raw.catno : null

  return {
    id: raw.id,
    masterId: raw.master_id ?? null,
    artist: stripDisambiguator(credit),
    credits: credit ? creditNames(credit) : [],
    title,
    year: Number.isFinite(year) ? year : 0,
    country: raw.country ?? null,
    label: raw.label?.at(0) ?? null,
    catno,
    format: formatParts.length > 0 ? formatParts.join(' · ') : null,
    inCollection: raw.user_data?.in_collection ?? false,
    inWantlist: raw.user_data?.in_wantlist ?? false,
  }
}
