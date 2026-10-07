import { Icon } from './Icon'
import type { IconProps } from './Icon'

// A record half out of its sleeve: something you own and play
export const CollectionIcon = (props: IconProps) => (
  <Icon {...props}>
    <rect x="3" y="5" width="13" height="14" rx=".6" />
    <path d="M16 5.07A7 7 0 0 1 16 18.93" />
    <path d="M16 8.6A3.6 3.6 0 0 1 16 15.4" />
  </Icon>
)
