import type {
  ArtistResult,
  MasterResult,
  ReleaseDetail,
  Version,
} from './search.schema'
import { stripDisambiguator } from '#/shared/utils/artist-name'

export type Master = {
  id: number
  title: string
  artist: string
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

export type ReleaseDetailModel = {
  id: number
  title: string
  year: number
  country: string
  artists: string[]
  formatName: string
  formatText: string
}

export function toReleaseDetail(raw: ReleaseDetail): ReleaseDetailModel {
  return {
    id: raw.id,
    title: raw.title,
    year: raw.year,
    country: raw.country ?? '',
    artists: raw.artists.map((a) => stripDisambiguator(a.name)),
    formatName: raw.formats?.[0]?.name ?? '',
    formatText: raw.formats?.[0]?.text ?? '',
  }
}

export function toMaster(raw: MasterResult): Master {
  const dashIdx = raw.title.indexOf(' - ')
  return {
    id: raw.id,
    title: dashIdx >= 0 ? raw.title.slice(dashIdx + 3) : raw.title,
    artist: dashIdx >= 0 ? stripDisambiguator(raw.title.slice(0, dashIdx)) : '',
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
