import { grooveSpiralPath } from '#/shared/utils/groove-spiral'

import { Icon } from './Icon'
import type { IconProps } from './Icon'

const GROOVE = grooveSpiralPath({
  turns: 1.75,
  innerRadius: 2.2,
  outerRadius: 8,
  centre: { x: 11, y: 13 },
})

// The needle drops onto a groove: what do I play now?
export const RandomPickIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d={GROOVE} />
    <path d="M21 3v5.5L15.2 13" />
    <circle cx="15.2" cy="13" r="1.3" fill="currentColor" stroke="none" />
  </Icon>
)
