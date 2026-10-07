import { Icon } from './Icon'
import type { IconProps } from './Icon'

// The wantlist sleeve closes and now holds the record
export const FulfilledWantIcon = (props: IconProps) => (
  <Icon {...props}>
    <rect x="4" y="4" width="16" height="16" rx=".6" />
    <circle cx="12" cy="12" r="5" />
    <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
  </Icon>
)
