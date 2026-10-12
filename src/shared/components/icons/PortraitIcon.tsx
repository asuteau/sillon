import { Icon } from './Icon'
import type { IconProps } from './Icon'

// A portrait frame holding one groove: the Collection seen whole
export const PortraitIcon = (props: IconProps) => (
  <Icon {...props}>
    <rect x="5" y="3" width="14" height="18" rx=".6" />
    <circle cx="12" cy="12" r="4" />
    <path d="M10 12A2 2 0 0 1 12 10" />
  </Icon>
)
