import { CoverArt } from '#/shared/components/CoverArt'

type Props = Omit<React.ComponentProps<typeof CoverArt>, 'className' | 'size'>

// Square cover that shrinks (down to 10rem) so the sheet fits without scrolling.
// Parent must be a height-constrained flex column.
export function SheetCover(props: Props) {
  return (
    <div className="aspect-square min-h-40 w-full">
      <CoverArt
        {...props}
        className="mx-auto aspect-square h-full max-w-full overflow-hidden rounded-2xl"
      />
    </div>
  )
}
