export type CoverState = 'loading' | 'image' | 'house'

interface CoverStateInput {
  thumb: string | null
  thumbFailed: boolean
  /** The HD lookup has finished, matched or not */
  hdSettled: boolean
  hdSrc: string | null
  hdFailed: boolean
}

// A House sleeve only once we know there is no artwork — never while it loads
export const coverState = ({
  thumb,
  thumbFailed,
  hdSettled,
  hdSrc,
  hdFailed,
}: CoverStateInput): CoverState => {
  if (thumb && !thumbFailed) return 'image'
  if (!hdSettled) return 'loading'
  if (hdSrc && !hdFailed) return 'image'
  return 'house'
}
