import type { SVGProps } from 'react'

// Same props shape as lucide, so Sillon icons and lucide icons swap freely
export interface IconProps extends SVGProps<SVGSVGElement> {
  size?: number | string
}

// The groove's line language: 24px grid, 1.5 stroke, round caps and joins.
// Decorative unless given an accessible name.
export const Icon = ({ size = 24, children, ...rest }: IconProps) => {
  const labelled = rest['aria-label'] != null || rest['aria-labelledby'] != null

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...(labelled ? { role: 'img' } : { 'aria-hidden': true })}
      {...rest}
    >
      {children}
    </svg>
  )
}
