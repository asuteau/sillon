import type { StackEntry } from './stack.model'

export type CommitEvent =
  | { type: 'adding'; barcode: string }
  | { type: 'added'; barcode: string }
  | { type: 'failed'; barcode: string }
  /** Discogs is throttling: waiting before trying again */
  | { type: 'paused' }
  | { type: 'resumed' }

// Discogs counts requests over a moving minute: a pause of a few seconds,
// repeated past a minute, always outlasts it
const PAUSE_MS = 10_000
const MAX_PAUSES = 7

const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms))

interface CommitStackOptions<T> {
  /** Newest first, as the Stack lists them */
  entries: StackEntry[]
  /** Adds one record to the list */
  add: (entry: StackEntry) => Promise<T>
  /** The add was refused by Discogs' rate limit: try it again later */
  isThrottled?: (result: T) => boolean
  wait?: (ms: number) => Promise<void>
  onEvent?: (event: CommitEvent) => void
}

export interface CommitResult<T> {
  added: { entry: StackEntry; result: T }[]
  /** Still to add: they stay on the Stack */
  failed: StackEntry[]
}

/** Adds a Stack's records one after another (Discogs has no bulk add),
 * oldest scanned first, so the list's own order follows the scan. Pauses
 * while Discogs throttles, then carries on */
export const commitStack = async <T>({
  entries,
  add,
  isThrottled = () => false,
  wait = sleep,
  onEvent,
}: CommitStackOptions<T>): Promise<CommitResult<T>> => {
  const result: CommitResult<T> = { added: [], failed: [] }

  const addOne = async (entry: StackEntry) => {
    for (let pauses = 0; ; pauses++) {
      const answer = await add(entry)
      if (!isThrottled(answer)) {
        if (pauses > 0) onEvent?.({ type: 'resumed' })
        return answer
      }
      if (pauses === MAX_PAUSES) {
        onEvent?.({ type: 'resumed' })
        throw new Error('Still throttled')
      }
      onEvent?.({ type: 'paused' })
      await wait(PAUSE_MS)
    }
  }

  for (const entry of [...entries].reverse()) {
    onEvent?.({ type: 'adding', barcode: entry.barcode })
    try {
      result.added.push({ entry, result: await addOne(entry) })
      onEvent?.({ type: 'added', barcode: entry.barcode })
    } catch {
      result.failed.push(entry)
      onEvent?.({ type: 'failed', barcode: entry.barcode })
    }
  }

  return result
}
