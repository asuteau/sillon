import type { CollectionRelease } from './collection.schema'

export type CollectionRecord = {
  id: number
  instanceId: number
  dateAdded: string
  title: string
  year: number
  artists: string[]
  coverImage: string
  thumb: string
}

export function toRecord(release: CollectionRelease): CollectionRecord {
  return {
    id: release.id,
    instanceId: release.instance_id,
    dateAdded: release.date_added,
    title: release.basic_information.title,
    year: release.basic_information.year,
    artists: release.basic_information.artists.map((a) => a.name),
    coverImage: release.basic_information.cover_image,
    thumb: release.basic_information.thumb,
  }
}
