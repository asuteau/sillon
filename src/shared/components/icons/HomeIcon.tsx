import { grooveSpiralPath } from '#/shared/utils/groove-spiral'

import { Icon } from './Icon'
import type { IconProps } from './Icon'

// The groove mark itself, so home is the brand
const GROOVE = grooveSpiralPath({
  turns: 2.5,
  innerRadius: 1,
  outerRadius: 9.5,
  centre: { x: 12, y: 12 },
})

export const HomeIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d={GROOVE} />
  </Icon>
)
