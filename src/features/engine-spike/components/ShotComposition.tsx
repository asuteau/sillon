import { Easing, interpolate, useCurrentFrame, useVideoConfig } from 'remotion'

import {
  SHOT,
  scaleTransform,
  shiftTransform,
  spinTransform,
} from '../shot.timeline'
import { ShotStage } from './ShotStage'

interface Move {
  start: number
  end: number
  from: number
  to: number
  ease: readonly [number, number, number, number]
}

// The shot with Remotion: a pure function of the frame. Every value is
// `interpolate()` of the current time through the same numbers and curves;
// there is no timeline object, scrubbing is just calling this with another
// frame.
const at = (ms: number, m: Move): number =>
  interpolate(ms, [m.start, m.end], [m.from, m.to], {
    easing: Easing.bezier(...m.ease),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

export const ShotComposition = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const ms = (frame / fps) * 1000

  return (
    <ShotStage
      poses={{
        camera: { transform: scaleTransform(at(ms, SHOT.push)) },
        pan: { transform: shiftTransform(at(ms, SHOT.pan)) },
        sleeve: { transform: shiftTransform(at(ms, SHOT.sleeveX)) },
        disc: { transform: shiftTransform(at(ms, SHOT.discX)) },
        spin: { transform: spinTransform(at(ms, SHOT.spin)) },
        sweep: {
          transform: shiftTransform(at(ms, SHOT.sweepX)),
          // In then out: the two ramps never overlap, so their product is
          // the whole envelope
          opacity: at(ms, SHOT.sweepIn) * at(ms, SHOT.sweepOut),
        },
      }}
    />
  )
}
