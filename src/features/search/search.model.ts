import type {
  ArtistResult,
  MasterResult,
  ReleaseDetail,
  Version,
} from './search.schema'
import type { RecordScreenRecord } from '#/shared/components/RecordScreen'
import { creditNames, stripDisambiguator } from '#/shared/utils/artist-name'

export type Master = {
  id: number
  title: string
  artist: string
  /** Every artist credited, Lead credit first, to look the Cover up by */
  credits: string[]
  year: number | null
  formats: string[]
  inCollection: boolean
  inWantlist: boolean
}

export type MasterVersion = {
  id: number
  year: number
  country: string
  majorFormat: string
  format: string
  formats: Array<{ descriptions?: string[]; text?: string }>
  inCollection: number
  inWantlist: number
}

// A Release from Search, as the Record screen shows it: no date added, since
// it isn't a Copy or a want, but its country, to tell pressings apart
export function toSearchRecord(raw: ReleaseDetail): RecordScreenRecord {
  return {
    id: raw.id,
    basic_information: {
      master_id: raw.master_id ?? undefined,
      title: raw.title,
      year: raw.year,
      country: raw.country ?? undefined,
      artists: raw.artists,
      styles: raw.styles ?? [],
      formats: (raw.formats ?? []).map((f) => ({
        name: f.name,
        qty: f.qty ?? undefined,
        descriptions: f.descriptions ?? undefined,
        text: f.text ?? undefined,
      })),
      labels: (raw.labels ?? []).map((l) => ({
        name: l.name,
        catno: l.catno ?? undefined,
      })),
    },
  }
}

export function toMaster(raw: MasterResult): Master {
  const dashIdx = raw.title.indexOf(' - ')
  return {
    id: raw.id,
    title: dashIdx >= 0 ? raw.title.slice(dashIdx + 3) : raw.title,
    artist: dashIdx >= 0 ? stripDisambiguator(raw.title.slice(0, dashIdx)) : '',
    credits: dashIdx >= 0 ? creditNames(raw.title.slice(0, dashIdx)) : [],
    year: raw.year ? parseInt(raw.year, 10) || null : null,
    formats: raw.format ?? [],
    inCollection: raw.user_data?.in_collection ?? false,
    inWantlist: raw.user_data?.in_wantlist ?? false,
  }
}

export type Artist = {
  id: number
  name: string
  // Artist picture, the one Discogs image Sillon shows
  picture: string
  genres: string[]
  styles: string[]
}

export type ArtistDiscographyItem = {
  id: number
  title: string
  /** Every artist credited, Lead credit first, to look the Cover up by */
  credits: string[]
  year: number | null
  formats: string[]
}

export function toArtist(raw: ArtistResult): Artist {
  return {
    id: raw.id,
    name: stripDisambiguator(raw.title),
    picture: raw.thumb,
    genres: raw.genres ?? [],
    styles: raw.styles ?? [],
  }
}

export function toArtistDiscographyItem(
  raw: MasterResult,
): ArtistDiscographyItem {
  const dashIdx = raw.title.indexOf(' - ')
  return {
    id: raw.id,
    title: dashIdx >= 0 ? raw.title.slice(dashIdx + 3) : raw.title,
    credits: dashIdx >= 0 ? creditNames(raw.title.slice(0, dashIdx)) : [],
    year: raw.year ? parseInt(raw.year, 10) || null : null,
    formats: raw.format ?? [],
  }
}

export function toMasterVersion(raw: Version): MasterVersion {
  return {
    id: raw.id,
    year: parseInt(raw.released, 10) || 0,
    country: raw.country,
    majorFormat: raw.major_formats[0] ?? '',
    format: raw.format.replaceAll(', ', ' · '),
    formats:
      raw.formats?.map((f) => ({
        descriptions: f.descriptions,
        text: f.text,
      })) ?? [],
    inCollection: raw.stats.user.in_collection,
    inWantlist: raw.stats.user.in_wantlist,
  }
}
