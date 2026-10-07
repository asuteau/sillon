import { GrooveLoader } from './brand/GrooveLoader'

// Router pending state; follows the theme through currentColor
export const AppShellPending = () => (
  <div className="grid min-h-[60svh] place-items-center text-foreground">
    <GrooveLoader />
  </div>
)
