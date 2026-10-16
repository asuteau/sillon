import { ArrowLeft } from 'lucide-react'

import { Button } from '#/shared/components/ui/button'

import type { Pressing } from '../stack.model'
import { pressingDetails } from './StackRow'

interface PressingChooserProps {
  pressings: Pressing[]
  chosenId: number | null
  onChoose: (releaseId: number) => void
  onBack: () => void
}

// One barcode, several Releases: the user says which one is in hand. Sillon
// never guesses: the wrong one is the wrong Vinyl colour, year and value
export const PressingChooser = ({
  pressings,
  chosenId,
  onChoose,
  onBack,
}: PressingChooserProps) => {
  const [first] = pressings

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="flex shrink-0 items-center gap-2">
        <Button variant="ghost" size="icon" onClick={onBack} aria-label="Back">
          <ArrowLeft />
        </Button>
        <div className="min-w-0">
          <p className="type-caps truncate text-[11px] text-muted-foreground">
            {first.artist}
          </p>
          <p className="type-title truncate text-[15px] text-foreground">
            Which pressing of {first.title}?
          </p>
        </div>
      </div>
      <ul className="min-h-0 flex-1 divide-y divide-border overflow-y-auto border-y border-border">
        {pressings.map((pressing) => (
          <li key={pressing.id}>
            <button
              type="button"
              aria-pressed={pressing.id === chosenId}
              onClick={() => onChoose(pressing.id)}
              className="flex w-full cursor-pointer flex-col gap-1 px-1 py-3 text-left transition-colors duration-160 ease-fade hover:bg-muted aria-pressed:bg-muted"
            >
              <span className="type-catalogue text-[11px] text-foreground">
                {pressingDetails(pressing) || 'No details on Discogs'}
              </span>
              {pressing.format && (
                <span className="text-xs text-muted-foreground">
                  {pressing.format}
                </span>
              )}
              {(pressing.inCollection || pressing.inWantlist) && (
                <span className="text-xs text-muted-foreground">
                  {pressing.inCollection
                    ? 'In your Collection'
                    : 'On your Wantlist'}
                </span>
              )}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
