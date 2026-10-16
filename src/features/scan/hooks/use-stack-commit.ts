import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useMatch } from '@tanstack/react-router'

import { addStackRecord } from '../scan.api'
import type { StackAddResult } from '../scan.api'
import { patchListsAfterStack } from '../scan.queries'
import { commitStack } from '../stack-commit'
import type { CommitEvent } from '../stack-commit'
import { recordsToAdd, removeRecord } from '../stack.model'
import type { StackEntry, StackList } from '../stack.model'
import { getStack, updateStack, useStack } from '../stack.store'

/** Where a record is in being added: absent until confirming reaches it */
export type AddState = 'adding' | 'failed'

/** Confirms the Stack: adds its records to a list one after another. Each
 * leaves the Stack as it lands; one that fails stays */
export const useStackCommit = () => {
  const queryClient = useQueryClient()
  const user = useMatch({ from: '__root__', select: (m) => m.context.user })
  const [addStates, setAddStates] = useState<Record<string, AddState>>({})
  const [isCommitting, setIsCommitting] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const stack = useStack()

  const handleEvent = (event: CommitEvent) => {
    if (event.type === 'paused' || event.type === 'resumed') {
      return setIsPaused(event.type === 'paused')
    }
    if (event.type === 'added') {
      updateStack((s) => removeRecord(s, event.barcode))
    }
    setAddStates((states) => {
      const { [event.barcode]: _, ...others } = states
      return event.type === 'added'
        ? others
        : { ...others, [event.barcode]: event.type }
    })
  }

  /** Resolves with what was added, once every record has been tried.
   * `only`: just these records, e.g. one that failed, to retry it */
  const commit = async (list: StackList, only?: string) => {
    setIsCommitting(true)
    try {
      const { added } = await commitStack<StackAddResult>({
        entries: recordsToAdd(getStack(), list).filter(
          (entry) => only === undefined || entry.barcode === only,
        ),
        add: ({ release }: StackEntry) =>
          addStackRecord({ data: { releaseId: release.id, list } }),
        isThrottled: (result) => result.status === 'throttled',
        onEvent: handleEvent,
      })
      await patchListsAfterStack(
        queryClient,
        user?.username,
        added.map((a) => a.result),
      )
      return added.map((a) => a.entry)
    } finally {
      setIsCommitting(false)
      setIsPaused(false)
    }
  }

  // Only records still on the Stack: Clear stack takes their failures too
  const failedCount = stack.records.filter(
    (record) => addStates[record.barcode] === 'failed',
  ).length

  return { addStates, failedCount, isCommitting, isPaused, commit }
}
