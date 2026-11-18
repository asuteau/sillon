import { SLEEVE_COMPOSITIONS } from '#/shared/utils/house-sleeve'
import { cn } from '#/shared/utils/cn'

// Bar widths in groove-like, uneven steps
const BARS = [
  2, 1, 3, 1, 1, 2, 4, 1, 2, 1, 3, 2, 1, 1, 3, 1, 2, 4, 1, 2, 1, 1, 3,
]

// Printed paper, whichever the theme
const [PAPER] = SLEEVE_COMPOSITIONS

// An EAN-13 as printed under its bars: 5 021732 098143
const printed = (barcode: string) =>
  `${barcode.slice(0, 1)} ${barcode.slice(1, 7)} ${barcode.slice(7)}`

interface SleeveBackProps {
  artist: string
  title: string
  label: string
  catno: string
  barcode: string
  className?: string
}

// The back of a made-up record's sleeve, the side a shop scan reads: its
// name, the running order as faint lines, the label, and the barcode
export const SleeveBack = ({
  artist,
  title,
  label,
  catno,
  barcode,
  className,
}: SleeveBackProps) => (
  <div
    aria-hidden
    className={cn(
      '@container relative flex aspect-square flex-col gap-[4cqw] overflow-hidden rounded-(--radius) p-[8cqw]',
      className,
    )}
    style={{ background: PAPER.ground, color: PAPER.ink }}
  >
    <div className="flex items-start justify-between gap-[4cqw]">
      <p className="type-title min-w-0 text-[6cqw] leading-tight">
        {artist}
        <span className="block opacity-60">{title}</span>
      </p>
      <p className="type-catalogue shrink-0 text-right text-[3.4cqw] leading-tight opacity-70">
        {label}
        <span className="block">{catno}</span>
      </p>
    </div>
    <div className="flex flex-col gap-[2.4cqw] opacity-25">
      {[62, 48, 70, 40, 56].map((width, i) => (
        <span
          key={i}
          className="h-[1.6cqw] rounded-full bg-current"
          style={{ width: `${width}%` }}
        />
      ))}
    </div>
    {/* The barcode, centred, where the viewfinder locks on */}
    <div className="absolute bottom-[8cqw] left-1/2 flex h-[26cqw] w-[58cqw] -translate-x-1/2 flex-col gap-[1.5cqw] bg-white px-[3cqw] pt-[2.5cqw] pb-[1.5cqw]">
      <div className="flex min-h-0 flex-1 justify-between">
        {BARS.map((width, i) => (
          <span
            key={i}
            className="h-full"
            style={{ width: `${width * 0.8}cqw`, background: PAPER.ink }}
          />
        ))}
      </div>
      <span className="type-catalogue text-center text-[3.6cqw] leading-none">
        {printed(barcode)}
      </span>
    </div>
  </div>
)
