// A full read of a Discogs list: every page, until every record is read

export type ListPagination = { page: number; pages: number; items: number }

/** How a list's pages hold its records, and what tells two records apart */
export interface ListReader<TPage, TRecord> {
  recordsOf: (page: TPage) => TRecord[]
  keyOf: (record: TRecord) => number
}

export type ReadProgress = {
  read: number
  /** Record count, unknown before the first page */
  total: number | undefined
  /** Discogs pages still to ask for, unknown before the first page */
  requestsLeft: number | undefined
  /** Every record read: only then do figures and filters show */
  isComplete: boolean
  /** Every page read, yet records missing: a removal shifted Discogs' pages
   *  under the read, or restored pages predate a change made elsewhere */
  hasGap: boolean
}

// A record read twice (pages shifting under a read) still counts once
export const uniqueRecords = <TRecord>(
  records: TRecord[],
  keyOf: (record: TRecord) => number,
): TRecord[] => [...new Map(records.map((r) => [keyOf(r), r])).values()]

export const readRecords = <TPage, TRecord>(
  pages: TPage[],
  { recordsOf, keyOf }: ListReader<TPage, TRecord>,
): TRecord[] => uniqueRecords(pages.flatMap(recordsOf), keyOf)

export const readProgress = <
  TPage extends { pagination: ListPagination },
  TRecord,
>(
  pages: TPage[] | undefined,
  reader: ListReader<TPage, TRecord>,
): ReadProgress => {
  const last = pages?.at(-1)
  if (!pages || !last)
    return {
      read: 0,
      total: undefined,
      requestsLeft: undefined,
      isComplete: false,
      hasGap: false,
    }
  const total = last.pagination.items
  const read = Math.min(readRecords(pages, reader).length, total)
  const isLastPage = last.pagination.page >= last.pagination.pages
  return {
    read,
    total,
    requestsLeft: Math.max(0, last.pagination.pages - last.pagination.page),
    isComplete: isLastPage && read === total,
    hasGap: isLastPage && read < total,
  }
}
