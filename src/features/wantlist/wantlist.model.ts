import type { ListReader } from '#/shared/utils/full-read'

import type { WantlistListPage } from './wantlist.queries'
import type { WantlistItem } from './wantlist.schema'

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

// A release is wanted once: its ID tells Wants apart
export const wantlistReader: ListReader<WantlistListPage, WantlistItem> = {
  recordsOf: (page) => page.wants,
  keyOf: (want) => want.id,
}
