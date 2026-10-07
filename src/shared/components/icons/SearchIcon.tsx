import { Icon } from './Icon'
import type { IconProps } from './Icon'

// A lens with a single groove inside
export const SearchIcon = (props: IconProps) => (
  <Icon {...props}>
    <circle cx="10.5" cy="10.5" r="6.5" />
    <path d="M7 10.5A3.5 3.5 0 0 1 10.5 7" />
    <path d="M15.4 15.4 20.5 20.5" />
  </Icon>
)
