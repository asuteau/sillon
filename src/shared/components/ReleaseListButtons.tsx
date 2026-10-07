import { Check } from 'lucide-react'

import { CollectionIcon } from '#/shared/components/icons/CollectionIcon'
import { WantlistIcon } from '#/shared/components/icons/WantlistIcon'

import { Button } from './ui/button'

interface ReleaseListButtonsProps {
  inCollection: boolean
  inWantlist: boolean
  onCollectionToggle?: () => void
  onWantlistToggle?: () => void
  isCollectionPending?: boolean
  isWantlistPending?: boolean
}

// A Release's Collection and Wantlist toggles. Presentational: also used by
// the landing hero
export const ReleaseListButtons = ({
  inCollection,
  inWantlist,
  onCollectionToggle,
  onWantlistToggle,
  isCollectionPending = false,
  isWantlistPending = false,
}: ReleaseListButtonsProps) => (
  <div className="flex justify-center gap-3 pt-1">
    <Button
      variant={inCollection ? 'default' : 'outline'}
      disabled={isCollectionPending}
      onClick={onCollectionToggle}
    >
      {inCollection ? (
        <Check className="size-4" />
      ) : (
        <CollectionIcon className="size-4" />
      )}
      {inCollection ? 'Owned' : 'Collection'}
    </Button>

    <Button
      variant={inWantlist ? 'default' : 'outline'}
      disabled={isWantlistPending}
      onClick={onWantlistToggle}
    >
      {inWantlist ? (
        <Check className="size-4" />
      ) : (
        <WantlistIcon className="size-4" />
      )}
      {inWantlist ? 'Wanted' : 'Wantlist'}
    </Button>
  </div>
)
