import type { WantlistItem } from './wantlist.schema'

export type WantRecord = {
  id: number
  dateAdded: string
  title: string
  year: number
  artists: string[]
  coverImage: string
  thumb: string
}

export function toWantRecord(item: WantlistItem): WantRecord {
  return {
    id: item.id,
    dateAdded: item.date_added,
    title: item.basic_information.title,
    year: item.basic_information.year,
    artists: item.basic_information.artists.map((a) => a.name),
    coverImage: item.basic_information.cover_image,
    thumb: item.basic_information.thumb,
  }
}
