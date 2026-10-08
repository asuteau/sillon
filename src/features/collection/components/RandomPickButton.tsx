import { useRandomPick } from '#/features/collection/hooks/use-random-pick'
import { GrooveLoader } from '#/shared/components/brand/GrooveLoader'
import { RandomPickIcon } from '#/shared/components/icons/RandomPickIcon'
import { Button } from '#/shared/components/ui/button'
import { RandomPickSpotlight } from './RandomPickSpotlight'

export const RandomPickButton = () => {
  const { record, isPicking, isError, pick, close } = useRandomPick()

  return (
    <div className="flex flex-col items-end gap-1">
      <Button variant="lacquer" onClick={pick} disabled={isPicking}>
        {isPicking ? <GrooveLoader size={14} /> : <RandomPickIcon />}
        Pick for me
      </Button>
      {isError && !record && (
        <p role="alert" className="m-0 text-sm text-foreground">
          Couldn't reach Discogs. Try again.
        </p>
      )}

      <RandomPickSpotlight
        record={record}
        isPicking={isPicking}
        isError={isError}
        onPickAgain={pick}
        onClose={close}
      />
    </div>
  )
}
