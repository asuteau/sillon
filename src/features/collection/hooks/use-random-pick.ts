import { randomRecordQueryOptions } from '#/features/collection/collection.queries'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

export const useRandomPick = () => {
  const [isOpen, setIsOpen] = useState(false)
  const {
    data: record,
    isFetching: isPicking,
    refetch,
  } = useQuery(randomRecordQueryOptions)

  const pick = async () => {
    try {
      const result = await refetch()
      if (result.data) setIsOpen(true)
    } catch (error) {
      console.error('Random pick failed', error)
    }
  }

  const close = () => setIsOpen(false)

  return {
    record: isOpen ? (record ?? undefined) : undefined,
    isPicking,
    pick,
    close,
  }
}
