// The Stack (CONTEXT.md): the records scanned in one go, waiting to be
// confirmed. Pure: every change returns a new Stack

/** A Release a barcode matched on Discogs */
export interface ReleaseMatch {
  id: number
  masterId: number | null
  /** The credit as printed, without Discogs' "(2)" */
  artist: string
  /** Each artist credited, to look the Cover up by */
  credits: string[]
  title: string
  /** 0 when Discogs has no year */
  year: number
  country: string | null
  label: string | null
  catno: string | null
  format: string | null
  inCollection: boolean
  inWantlist: boolean
}

export type StackRecord =
  | { barcode: string; status: 'looking-up' }
  | { barcode: string; status: 'lookup-failed' }
  | {
      barcode: string
      status: 'found'
      matches: ReleaseMatch[]
      /** Null while Unresolved: several Releases and none chosen yet */
      chosenId: number | null
      /** Added even though already in the list: another Copy */
      included: boolean
    }

type FoundRecord = Extract<StackRecord, { status: 'found' }>

export interface Stack {
  /** Newest first */
  records: StackRecord[]
  /** Barcodes Discogs doesn't know: the sleeves set aside */
  notFound: string[]
}

export const EMPTY_STACK: Stack = { records: [], notFound: [] }

export type StackList = 'collection' | 'wantlist'

/** `repeat`: already in the Stack; `not-found`: already known not to be on
 * Discogs. Either way the Stack is left as is. `retry`: its lookup had
 * failed, so it's looked up again */
export type ScanOutcome = 'new' | 'repeat' | 'not-found' | 'retry'

export const scanBarcode = (
  stack: Stack,
  barcode: string,
): { stack: Stack; outcome: ScanOutcome } => {
  if (stack.notFound.includes(barcode)) return { stack, outcome: 'not-found' }
  const existing = stack.records.find((r) => r.barcode === barcode)
  if (existing?.status === 'lookup-failed') {
    return {
      stack: setStatus(stack, barcode, 'looking-up'),
      outcome: 'retry',
    }
  }
  if (existing) return { stack, outcome: 'repeat' }

  return {
    stack: {
      ...stack,
      records: [{ barcode, status: 'looking-up' }, ...stack.records],
    },
    outcome: 'new',
  }
}

const setStatus = (
  stack: Stack,
  barcode: string,
  status: 'looking-up' | 'lookup-failed',
): Stack => ({
  ...stack,
  records: stack.records.map((r) =>
    r.barcode === barcode ? ({ barcode, status } satisfies StackRecord) : r,
  ),
})

/** Discogs couldn't be asked: scanning the barcode again retries */
export const lookupFailed = (stack: Stack, barcode: string): Stack =>
  setStatus(stack, barcode, 'lookup-failed')

/** The Releases Discogs matched for a barcode: none takes it off the Stack */
export const lookedUp = (
  stack: Stack,
  barcode: string,
  matches: ReleaseMatch[],
): Stack => {
  if (matches.length === 0) {
    return {
      records: stack.records.filter((r) => r.barcode !== barcode),
      notFound: [...stack.notFound, barcode],
    }
  }

  return {
    ...stack,
    records: stack.records.map((r) =>
      r.barcode === barcode
        ? {
            barcode,
            status: 'found',
            matches,
            chosenId: matches.length === 1 ? matches[0].id : null,
            included: false,
          }
        : r,
    ),
  }
}

const updateFound = (
  stack: Stack,
  barcode: string,
  update: (record: FoundRecord) => FoundRecord,
): Stack => ({
  ...stack,
  records: stack.records.map((r) =>
    r.barcode === barcode && r.status === 'found' ? update(r) : r,
  ),
})

/** Off the Stack: removed by hand, or added to the list */
export const removeRecord = (stack: Stack, barcode: string): Stack => ({
  ...stack,
  records: stack.records.filter((r) => r.barcode !== barcode),
})

/** The user's pick among the Releases a barcode matched. Another release
 * is another record: whether to include it is asked afresh */
export const chooseRelease = (
  stack: Stack,
  barcode: string,
  releaseId: number,
): Stack =>
  updateFound(stack, barcode, (r) =>
    r.matches.some((p) => p.id === releaseId)
      ? { ...r, chosenId: releaseId, included: false }
      : r,
  )

/** Includes a record already in the list, or leaves it out again */
export const toggleIncluded = (stack: Stack, barcode: string): Stack =>
  updateFound(stack, barcode, (r) => ({ ...r, included: !r.included }))

/** The release a record stands for, once there is no doubt about it */
export const chosenRelease = (record: StackRecord): ReleaseMatch | null =>
  record.status === 'found'
    ? (record.matches.find((p) => p.id === record.chosenId) ?? null)
    : null

export const isInList = (release: ReleaseMatch, list: StackList) =>
  list === 'collection' ? release.inCollection : release.inWantlist

export interface StackEntry {
  barcode: string
  release: ReleaseMatch
}

/** What confirming adds to the list, newest first */
export const recordsToAdd = (stack: Stack, list: StackList): StackEntry[] =>
  stack.records.flatMap((record) => {
    const release = chosenRelease(record)
    if (!release || record.status !== 'found') return []
    if (isInList(release, list) && !record.included) return []
    return [{ barcode: record.barcode, release }]
  })

export interface StackSummary {
  /** Records confirming will add */
  toAdd: number
  /** Records already in the list, left out */
  alreadyIn: number
  /** Records waiting for their release to be chosen */
  unresolved: number
  notFound: number
}

export const stackSummary = (stack: Stack, list: StackList): StackSummary => {
  const toAdd = recordsToAdd(stack, list).length
  let resolved = 0
  let unresolved = 0
  for (const record of stack.records) {
    if (record.status !== 'found') continue
    if (record.chosenId === null) unresolved++
    else resolved++
  }
  return {
    toAdd,
    alreadyIn: resolved - toAdd,
    unresolved,
    notFound: stack.notFound.length,
  }
}
