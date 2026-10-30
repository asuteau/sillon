import type { ReactNode } from 'react'

// Top artists and Top styles show at most ten entries
const HELD_ROWS = [100, 84, 72, 63, 56, 50, 45, 41, 37, 34]
const HELD_COLUMNS = [30, 55, 85, 100, 70, 45, 25]

interface PortraitHeldSectionsProps {
  /** The reading state, held above the first section */
  readout: ReactNode
}

// The scan-based sections while the Collection is read: each section's own
// geometry as flat --muted shapes, no pulse, like SleevePullSkeleton. The
// sections fade in over the same space, then their draw-ins play.
export const PortraitHeldSections = ({
  readout,
}: PortraitHeldSectionsProps) => (
  <div className="relative">
    {/* In the first section's top margin, so nothing moves on reveal */}
    <div className="absolute inset-x-0 top-2">{readout}</div>
    {/* Fades in with the readout, after the same delay */}
    <div aria-hidden className="reading-state">
      <HeldRanking />
      <HeldRanking />
      <HeldTimeChart />
      <HeldTimeChart />
    </div>
  </div>
)

// Same spacing as a section title (RankedList, TimeChart), with no words
const HeldTitle = () => (
  <span className="type-caps invisible mb-5 block text-[11px]">&nbsp;</span>
)

// RankedList's rows: rank, name, bar
const HeldRanking = () => (
  <div className="mt-14">
    <HeldTitle />
    <div className="flex flex-col gap-4">
      {HELD_ROWS.map((width) => (
        <div key={width} className="grid grid-cols-[2rem_1fr] items-baseline">
          <span className="type-catalogue invisible text-[11px]">00</span>
          <div className="flex flex-col gap-2">
            <span className="relative">
              &nbsp;
              <span
                className="absolute inset-y-1.5 left-0 bg-muted"
                style={{ width: `${width * 0.4}%` }}
              />
            </span>
            <span
              className="block h-0.75 bg-muted"
              style={{ width: `${width}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  </div>
)

// TimeChart's columns on a hairline baseline, with the label row
const HeldTimeChart = () => (
  <div className="mt-14">
    <HeldTitle />
    <div className="flex gap-1 sm:gap-2">
      {HELD_COLUMNS.map((height) => (
        <div key={height} className="flex min-w-0 flex-1 flex-col">
          <div className="flex h-32 flex-col items-center justify-end border-b border-border">
            <span
              className="block w-full max-w-8 bg-muted"
              style={{ height: `calc((100% - 1rem) * ${height / 100})` }}
            />
          </div>
          <span className="mt-1.5 h-3" />
        </div>
      ))}
    </div>
  </div>
)
