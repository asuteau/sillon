import type { StackEntry } from './stack.model'

export type CommitEvent =
  | { type: 'adding'; barcode: string }
  | { type: 'added'; barcode: string }
  | { type: 'failed'; barcode: string }

interface CommitStackOptions<T> {
  /** Newest first, as the Stack lists them */
  entries: StackEntry[]
  /** Adds one record to the list */
  add: (entry: StackEntry) => Promise<T>
  onEvent?: (event: CommitEvent) => void
}

export interface CommitResult<T> {
  added: { entry: StackEntry; result: T }[]
  /** Still to add: they stay on the Stack */
  failed: StackEntry[]
}

/** Adds a Stack's records one after another (Discogs has no bulk add),
 * oldest scanned first, so the list's own order follows the scan */
export const commitStack = async <T>({
  entries,
  add,
  onEvent,
}: CommitStackOptions<T>): Promise<CommitResult<T>> => {
  const result: CommitResult<T> = { added: [], failed: [] }

  for (const entry of [...entries].reverse()) {
    onEvent?.({ type: 'adding', barcode: entry.barcode })
    try {
      result.added.push({ entry, result: await add(entry) })
      onEvent?.({ type: 'added', barcode: entry.barcode })
    } catch {
      result.failed.push(entry)
      onEvent?.({ type: 'failed', barcode: entry.barcode })
    }
  }

  return result
}
