// For score tests: the design system's easings as src/styles.css defines
// them, so a score is checked against the tokens, not against CURVES
import { readFileSync } from 'node:fs'

import { bezier } from './film.model'

const CSS = readFileSync(
  new URL('../../../styles.css', import.meta.url),
  'utf8',
)

// `--ease-<name>`, as an easing of progress 0..1
export const easeToken = (name: 'platter' | 'fade') => {
  const values = CSS.match(
    new RegExp(`--ease-${name}:\\s*cubic-bezier\\(([^)]+)\\)`),
  )?.[1]
    .split(',')
    .map(Number)
  if (values?.length !== 4) throw new Error(`No --ease-${name} in styles.css`)
  const [x1, y1, x2, y2] = values
  return bezier([x1, y1, x2, y2])
}

// A value `ease`d halfway from `from` to `to`
export const halfway = (
  from: number,
  to: number,
  ease: (p: number) => number,
) => from + (to - from) * ease(0.5)
