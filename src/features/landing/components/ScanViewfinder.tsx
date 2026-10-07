import { SLEEVE_COMPOSITIONS } from '#/shared/utils/house-sleeve'
import { cn } from '#/shared/utils/cn'

// Bar widths in groove-like, uneven steps
const BARS = [
  2, 1, 3, 1, 1, 2, 4, 1, 2, 1, 3, 2, 1, 1, 3, 1, 2, 4, 1, 2, 1, 1, 3,
]

const CORNER = 'absolute size-6 border-white'

// The back of a paper House sleeve
const [PAPER] = SLEEVE_COMPOSITIONS

interface ScanViewfinderProps {
  className?: string
}

// The scanner's viewfinder over a sleeve's barcode
export const ScanViewfinder = ({ className }: ScanViewfinderProps) => (
  <div
    className={cn(
      'relative flex w-full flex-col items-center justify-center gap-4 overflow-hidden rounded-(--radius) bg-vinyl-black',
      className,
    )}
  >
    <div className="relative flex h-28 w-56 max-w-[80%] items-center justify-center px-5">
      <span className={`${CORNER} top-0 left-0 border-t-2 border-l-2`} />
      <span className={`${CORNER} top-0 right-0 border-t-2 border-r-2`} />
      <span className={`${CORNER} bottom-0 left-0 border-b-2 border-l-2`} />
      <span className={`${CORNER} right-0 bottom-0 border-b-2 border-r-2`} />
      <div
        className="flex h-16 w-full flex-col gap-1.5 rounded-(--radius) px-3 pt-2 pb-1.5"
        style={{ background: PAPER.ground }}
      >
        <div className="flex min-h-0 flex-1 justify-between">
          {BARS.map((width, i) => (
            <span
              key={i}
              className="h-full bg-vinyl-black"
              style={{ width: width * 1.5 }}
            />
          ))}
        </div>
        <span className="type-catalogue text-center text-[8px] leading-none text-vinyl-black">
          0 4 2 2 8 1 3 0 2 7 4
        </span>
      </div>
    </div>
    <p className="text-sm font-semibold text-white">Point at barcode</p>
  </div>
)
