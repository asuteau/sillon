import { Button } from '#/shared/components/ui/button'
import { ArrowLeft, ArrowRight } from 'lucide-react'

// The first record centred, two neighbours to its right, as the strip opens
const SLOTS = [0, 1, 1]

// The Sleeve pull while Recent additions loads: the strip's own geometry,
// flat sleeves and the centred disc pulled out, nothing moving. The strip
// fades in over the same space, in the same pose.
export const SleevePullSkeleton = () => (
  <div aria-hidden>
    <div data-skeleton className="sleeve-pull-strip -mx-4 min-[900px]:mx-0">
      <span className="sleeve-pull-spacer" />
      {SLOTS.map((distance, i) => (
        <span
          key={i}
          className="sleeve-pull-slide"
          data-cover-pending
          style={{ '--pull-distance': distance }}
        >
          <span className="sleeve-pull-body">
            {/* Neighbours' discs stay tucked, out of sight */}
            {distance === 0 && <span className="disc" />}
            <span className="sleeve-pull-sleeve" />
          </span>
        </span>
      ))}
    </div>

    {/* The caption's and arrows' space, empty */}
    <div className="invisible flex items-center gap-4">
      <Button
        variant="outline"
        size="icon-lg"
        className="hidden sm:inline-flex"
      >
        <ArrowLeft />
      </Button>
      <div className="flex flex-1 flex-col items-center gap-1">
        <span className="type-caps text-[11px]">&nbsp;</span>
        <span className="type-title text-xl">&nbsp;</span>
        <span className="type-catalogue text-[11px]">&nbsp;</span>
      </div>
      <Button
        variant="outline"
        size="icon-lg"
        className="hidden sm:inline-flex"
      >
        <ArrowRight />
      </Button>
    </div>
  </div>
)
