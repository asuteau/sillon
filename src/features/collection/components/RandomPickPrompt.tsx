import { useRandomPick } from '#/features/collection/hooks/use-random-pick'
import { GrooveLoader } from '#/shared/components/brand/GrooveLoader'
import { RandomPickIcon } from '#/shared/components/icons/RandomPickIcon'
import { Button } from '#/shared/components/ui/button'
import { RandomPickSpotlight } from './RandomPickSpotlight'

interface RandomPickPromptProps {
  /** Recent additions still loading: hold the prompt's space, unseen */
  isPending?: boolean
}

export const RandomPickPrompt = ({
  isPending = false,
}: RandomPickPromptProps) => {
  const { record, isPicking, isError, pick, close } = useRandomPick()

  return (
    <section
      aria-hidden={isPending || undefined}
      className={`mt-8 flex flex-col items-center gap-3 sm:mt-10 sm:gap-4 ${isPending ? 'invisible' : 'animate-in duration-160 ease-fade fade-in-0'}`}
    >
      <div className="flex flex-col gap-1">
        <p className="type-title m-0 text-base text-foreground">
          Not sure what to spin?
        </p>
        <p className="m-0 text-sm text-muted-foreground">
          Let Sillon pull a record from your collection.
        </p>
        {isError && !record && (
          <p role="alert" className="m-0 text-sm text-foreground">
            Couldn't reach Discogs. Try again.
          </p>
        )}
      </div>
      <Button variant="lacquer" size="lg" onClick={pick} disabled={isPicking}>
        {isPicking ? <GrooveLoader size={14} /> : <RandomPickIcon />}
        Pick for me
      </Button>

      <RandomPickSpotlight
        record={record}
        isPicking={isPicking}
        isError={isError}
        onPickAgain={pick}
        onClose={close}
      />
    </section>
  )
}
