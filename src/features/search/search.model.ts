import type {
  ArtistRelease,
  ArtistResult,
  MasterResult,
  ReleaseDetail,
  Version,
} from './search.schema'

export type Master = {
  id: number
  title: string
  artist: string
  year: number | null
  thumb: string
  coverImage: string
  formats: string[]
  inCollection: boolean
  inWantlist: boolean
}

export type MasterVersion = {
  id: number
  thumb: string
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
  coverImage: string
  formatName: string
  formatText: string
}

function stripDisambiguator(name: string): string {
  return name.replace(/\s*\(\d+\)$/, '')
}

export function toReleaseDetail(raw: ReleaseDetail): ReleaseDetailModel {
  return {
    id: raw.id,
    title: raw.title,
    year: raw.year,
    country: raw.country ?? '',
    artists: raw.artists.map((a) => stripDisambiguator(a.name)),
    coverImage: raw.images?.[0]?.uri ?? '',
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
    thumb: raw.thumb,
    coverImage: raw.cover_image,
    formats: raw.format ?? [],
    inCollection: raw.user_data?.in_collection ?? false,
    inWantlist: raw.user_data?.in_wantlist ?? false,
  }
}

export type Artist = {
  id: number
  name: string
  thumb: string
  genres: string[]
  styles: string[]
}

export type ArtistDiscographyItem = {
  id: number
  title: string
  year: number | null
  thumb: string
  format: string
}

export function toArtist(raw: ArtistResult): Artist {
  return {
    id: raw.id,
    name: stripDisambiguator(raw.title),
    thumb: raw.thumb,
    genres: raw.genres ?? [],
    styles: raw.styles ?? [],
  }
}

export function toArtistDiscographyItem(
  raw: ArtistRelease,
): ArtistDiscographyItem {
  return {
    id: raw.id,
    title: raw.title,
    year: raw.year ?? null,
    thumb: raw.thumb ?? '',
    format: raw.format ?? '',
  }
}

export function toMasterVersion(raw: Version): MasterVersion {
  return {
    id: raw.id,
    thumb: raw.thumb,
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
