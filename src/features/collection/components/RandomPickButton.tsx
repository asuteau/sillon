import { useRandomPick } from '#/features/collection/hooks/use-random-pick'
import { GrooveLoader } from '#/shared/components/brand/GrooveLoader'
import { RandomPickIcon } from '#/shared/components/icons/RandomPickIcon'
import { Button } from '#/shared/components/ui/button'
import { RandomPickSpotlight } from './RandomPickSpotlight'

export const RandomPickButton = () => {
  const { record, isPicking, pick, close } = useRandomPick()

  return (
    <>
      <Button variant="lacquer" onClick={pick} disabled={isPicking}>
        {isPicking ? <GrooveLoader size={14} /> : <RandomPickIcon />}
        Pick for me
      </Button>

      <RandomPickSpotlight
        record={record}
        isPicking={isPicking}
        onPickAgain={pick}
        onClose={close}
      />
    </>
  )
}
