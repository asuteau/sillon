import { Button as ButtonPrimitive } from '@base-ui/react/button'
import { cva } from 'class-variance-authority'
import type { VariantProps } from 'class-variance-authority'

import { cn } from '#/shared/utils/cn'

// Pressable = round like a record: rounded-full lives here, not in --radius
const buttonCva = cva(
  "group/button inline-flex shrink-0 cursor-pointer items-center justify-center rounded-full border border-transparent bg-clip-padding text-sm font-semibold whitespace-nowrap transition-[opacity,background-color,color,border-color] duration-160 ease-fade select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:opacity-85',
        outline:
          'border-border bg-transparent text-foreground hover:bg-muted aria-expanded:bg-muted',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-accent aria-expanded:bg-accent',
        ghost:
          'text-foreground hover:bg-muted aria-expanded:bg-muted dark:hover:bg-muted',
        destructive:
          'bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:outline-destructive dark:bg-destructive/20 dark:hover:bg-destructive/30',
        link: 'text-foreground underline-offset-4 hover:underline',
        // Brand moments only — never for general interactive state.
        // Satin, not the sweep: no text on the sweep. Borderless, so the page
        // doesn't show through as a ring around it
        lacquer:
          'border-0 bg-(image:--lacquer-satin) text-lacquer-foreground shadow-(--lacquer-satin-shadow) hover:bg-(image:--lacquer-satin-hover)',
      },
      size: {
        default:
          'h-8 gap-1.5 px-3.5 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3',
        xs: "h-6 gap-1 px-2.5 text-xs has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1 px-3 text-[0.8rem] has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: 'h-10 gap-1.5 px-5 has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4',
        icon: 'size-8',
        'icon-xs': "size-6 [&_svg:not([class*='size-'])]:size-3",
        'icon-sm': 'size-7',
        'icon-lg': 'size-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

// Merged so a variant can override the base (lacquer's border-0) even where
// the classes are used without cn(), e.g. on a link
const buttonVariants = (props?: VariantProps<typeof buttonCva>) =>
  cn(buttonCva(props))

function Button({
  className,
  variant = 'default',
  size = 'default',
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonCva>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonCva({ variant, size }), className)}
      {...props}
    />
  )
}

export { Button, buttonVariants }
