import { Icon } from './Icon'
import type { IconProps } from './Icon'

// An empty sleeve drawn dashed: a record you don't own yet
export const WantlistIcon = (props: IconProps) => (
  <Icon {...props}>
    <rect
      x="4"
      y="4"
      width="16"
      height="16"
      rx=".6"
      strokeDasharray="2.6 2.4"
    />
    <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
  </Icon>
)
