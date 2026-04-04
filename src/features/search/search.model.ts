import type { MasterResult, ReleaseDetail, Version } from './search.schema'

export type Master = {
  id: number
  title: string
  year: number | null
  thumb: string
  coverImage: string
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

export function toReleaseDetail(raw: ReleaseDetail): ReleaseDetailModel {
  return {
    id: raw.id,
    title: raw.title,
    year: raw.year,
    country: raw.country ?? '',
    artists: raw.artists.map((a) => a.name),
    coverImage: raw.images?.[0]?.uri ?? '',
    formatName: raw.formats?.[0]?.name ?? '',
    formatText: raw.formats?.[0]?.text ?? '',
  }
}

export function toMaster(raw: MasterResult): Master {
  return {
    id: raw.id,
    title: raw.title,
    year: raw.year ? parseInt(raw.year, 10) || null : null,
    thumb: raw.thumb,
    coverImage: raw.cover_image,
    inCollection: raw.user_data?.in_collection ?? false,
    inWantlist: raw.user_data?.in_wantlist ?? false,
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
