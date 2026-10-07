import { Input as InputPrimitive } from '@base-ui/react/input'

import { cn } from '#/shared/utils/cn'

// Field = square like a sleeve: 2px corners, hairline border
function Input({ className, type, ...props }: InputPrimitive.Props) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        'h-10 w-full min-w-0 rounded-(--radius) border border-input bg-card px-3 py-2 text-base text-foreground transition-colors duration-160 ease-fade placeholder:text-muted-foreground focus-visible:border-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive sm:text-sm',
        className,
      )}
      {...props}
    />
  )
}

export { Input }
