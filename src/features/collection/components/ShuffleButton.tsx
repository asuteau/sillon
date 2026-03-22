import { randomRecordQueryOptions } from '#/features/collection/collection.queries'
import { useQuery } from '@tanstack/react-query'
import { Shuffle } from 'lucide-react'
import { useState } from 'react'
import RecordSpotlight from './RecordSpotlight'

export default function ShuffleButton() {
  const [open, setOpen] = useState(false)
  const {
    data: record,
    isFetching,
    refetch,
  } = useQuery(randomRecordQueryOptions)

  async function handleShuffle() {
    const result = await refetch()
    if (result.data) setOpen(true)
  }

  return (
    <>
      <button
        onClick={handleShuffle}
        disabled={isFetching}
        aria-label="Surprise me"
        className="flex items-center gap-1.5 rounded-full border border-(--chip-line) bg-(--chip-bg) px-3 py-1.5 text-sm font-semibold text-(--sea-ink) transition hover:bg-(--lagoon)/10 disabled:opacity-50 cursor-pointer"
      >
        <Shuffle
          className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`}
        />
        <span className="hidden sm:inline">Surprise me</span>
      </button>

      {open && record && (
        <RecordSpotlight
          record={record}
          onClose={() => setOpen(false)}
          onPickAgain={handleShuffle}
          isPicking={isFetching}
        />
      )}
    </>
  )
}
