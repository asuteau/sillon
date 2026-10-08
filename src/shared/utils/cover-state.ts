export type CoverState = 'loading' | 'image' | 'house'

interface CoverStateInput {
  /** The Deezer lookup has finished, matched or not */
  hdSettled: boolean
  hdSrc: string | null
  hdFailed: boolean
}

// A House sleeve only once we know there is no artwork — never while it loads
export const coverState = ({
  hdSettled,
  hdSrc,
  hdFailed,
}: CoverStateInput): CoverState => {
  if (!hdSettled) return 'loading'
  if (hdSrc && !hdFailed) return 'image'
  return 'house'
}
