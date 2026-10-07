import { CoverArt } from '#/shared/components/CoverArt'

type Props = Omit<
  React.ComponentProps<typeof CoverArt>,
  'className' | 'size' | 'thumb'
>

// Square cover that shrinks (down to 10rem) so the sheet fits without scrolling.
// Parent must be a height-constrained flex column.
// Deezer HD only: the Discogs thumb is too small at this size, so the sheet
// waits for HD and falls back to a House sleeve, never to the thumb.
export function SheetCover(props: Props) {
  return (
    <div className="aspect-square min-h-40 w-full">
      <CoverArt
        {...props}
        thumb={null}
        className="mx-auto aspect-square h-full max-w-full overflow-hidden rounded-(--radius)"
      />
    </div>
  )
}
