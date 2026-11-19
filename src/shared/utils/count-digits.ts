export interface CountDigit {
  // '' when the column is gone
  digit: string
  // The digit this column replaces ('' if it is new); undefined when unchanged
  from: string | undefined
}

// Columns of a count rolling from one value to another, aligned on the units
export const countDigits = (from: number, to: number): CountDigit[] => {
  const before = String(from)
  const after = String(to)
  const width = Math.max(before.length, after.length)
  return Array.from({ length: width }, (_, i) => {
    const offset = width - 1 - i
    const digit = after[after.length - 1 - offset] ?? ''
    const previous = before[before.length - 1 - offset] ?? ''
    return { digit, from: digit === previous ? undefined : previous }
  })
}
