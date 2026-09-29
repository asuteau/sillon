import { useRandomPick } from '#/features/collection/hooks/use-random-pick'
import { Shuffle } from 'lucide-react'
import { RandomPickSpotlight } from './RandomPickSpotlight'

export const RandomPickCard = () => {
  const { record, isPicking, pick, close } = useRandomPick()

  return (
    <section className="island-shell rise-in mb-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl px-5 py-4">
      <div className="flex flex-col gap-0.5">
        <p className="m-0 font-semibold text-(--sea-ink)">
          Not sure what to spin?
        </p>
        <p className="m-0 text-sm text-(--sea-ink-soft)">
          Let Sillon pull a record from your collection.
        </p>
      </div>
      <button
        type="button"
        onClick={pick}
        disabled={isPicking}
        className="flex items-center gap-1.5 rounded-full bg-(--sea-ink) px-4 py-2 text-sm font-semibold text-(--chip-bg) transition hover:opacity-90 disabled:opacity-50 cursor-pointer"
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
    </section>
  )
}
