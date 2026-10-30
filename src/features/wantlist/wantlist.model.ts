import type { ListReader } from '#/shared/utils/full-read'

import type { WantlistItem, WantlistPage } from './wantlist.schema'

/** A page stamped with when it was asked of Discogs, to pace a full read */
export type WantlistListPage = WantlistPage & { fetchedAt: number }

export type WantRecord = {
  id: number
  dateAdded: string
  title: string
  year: number
  artists: string[]
}

export function toWantRecord(item: WantlistItem): WantRecord {
  return {
    id: item.id,
    dateAdded: item.date_added,
    title: item.basic_information.title,
    year: item.basic_information.year,
    artists: item.basic_information.artists.map((a) => a.name),
  }
}

// A Release is on the Wantlist once: its ID tells entries apart
export const wantlistReader: ListReader<WantlistListPage, WantlistItem> = {
  recordsOf: (page) => page.wants,
  keyOf: (want) => want.id,
}
