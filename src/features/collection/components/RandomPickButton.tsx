import { useRandomPick } from '#/features/collection/hooks/use-random-pick'
import { Shuffle } from 'lucide-react'
import { RandomPickSpotlight } from './RandomPickSpotlight'

export const RandomPickButton = () => {
  const { record, isPicking, pick, close } = useRandomPick()

  return (
    <>
      <button
        type="button"
        onClick={pick}
        disabled={isPicking}
        className="flex shrink-0 items-center gap-1.5 rounded-full border border-(--chip-line) bg-(--chip-bg) px-3 py-1.5 text-sm font-semibold text-(--sea-ink) transition hover:bg-(--lagoon)/10 disabled:opacity-50 cursor-pointer"
      >
        <Shuffle className={`h-3.5 w-3.5 ${isPicking ? 'animate-spin' : ''}`} />
        Pick for me
      </button>

      <RandomPickSpotlight
        record={record}
        isPicking={isPicking}
        onPickAgain={pick}
        onClose={close}
      />
    </>
  )
}
