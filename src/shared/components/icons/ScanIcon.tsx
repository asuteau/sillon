import { Icon } from './Icon'
import type { IconProps } from './Icon'

// A barcode spaced unevenly like grooves, in a viewfinder frame
export const ScanIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M3.5 8V3.5H8M16 3.5h4.5V8M20.5 16v4.5H16M8 20.5H3.5V16" />
    <path d="M7.5 8v8M9.8 8v8M11.4 8v8M14 8v8M16.5 8v8" />
  </Icon>
)
