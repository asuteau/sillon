import type { MasterResult, Version } from './search.schema'

export type Master = {
  id: number
  title: string
  year: number | null
  thumb: string
  coverImage: string
}

export type MasterVersion = {
  id: number
  thumb: string
  year: number
  country: string
  majorFormat: string
  format: string
  inCollection: number
  inWantlist: number
}

export function toMaster(raw: MasterResult): Master {
  return {
    id: raw.id,
    title: raw.title,
    year: raw.year ? parseInt(raw.year, 10) || null : null,
    thumb: raw.thumb,
    coverImage: raw.cover_image,
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
    inCollection: raw.stats.user.in_collection,
    inWantlist: raw.stats.user.in_wantlist,
  }
}
