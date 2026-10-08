import type { CollectionRelease } from '#/features/collection/collection.schema'
import { prepareRandomPick } from '#/features/collection/collection.queries'
import { profileQueryOptions } from '#/features/profile/profile.queries'
import { useQueryClient } from '@tanstack/react-query'
import { useMatch } from '@tanstack/react-router'
import { useRef, useState } from 'react'

type Prepared = Promise<CollectionRelease | null>

// Random pick, shown whole (see prepareRandomPick). While one is on screen the
// next is prepared in the background, so Pick again is usually instant.
export const useRandomPick = () => {
  const queryClient = useQueryClient()
  const username = useMatch({
    from: '__root__',
    select: (m) => m.context.user?.username,
  })
  const [record, setRecord] = useState<CollectionRelease>()
  const [isPicking, setIsPicking] = useState(false)
  const [isError, setIsError] = useState(false)
  // Bumped on close: a pick still loading then has nowhere to go
  const session = useRef(0)
  const next = useRef<Prepared | null>(null)

  const prepare = (excludeInstanceId?: number): Prepared => {
    const count = username
      ? queryClient.getQueryData(profileQueryOptions(username).queryKey)
          ?.recordCount
      : undefined
    return prepareRandomPick(queryClient, {
      count: count || undefined,
      excludeInstanceId,
    })
  }

  const prepareNext = (shown: CollectionRelease) => {
    const prepared = prepare(shown.instance_id)
    // A failed background draw stays silent: Pick again draws for real
    prepared.catch(() => {
      if (next.current === prepared) next.current = null
    })
    next.current = prepared
  }

  const pick = async () => {
    const current = session.current
    const exclude = record?.instance_id
    const prepared =
      next.current?.catch(() => prepare(exclude)) ?? prepare(exclude)
    next.current = null
    setIsPicking(true)
    setIsError(false)
    try {
      const result = await prepared
      if (session.current !== current) return
      if (result) {
        setRecord(result)
        prepareNext(result)
      }
    } catch (error) {
      if (session.current !== current) return
      console.error('Random pick failed', error)
      setIsError(true)
    } finally {
      if (session.current === current) setIsPicking(false)
    }
  }

  const close = () => {
    session.current++
    next.current = null
    setRecord(undefined)
    setIsPicking(false)
    setIsError(false)
  }

  return { record, isPicking, isError, pick, close }
}
