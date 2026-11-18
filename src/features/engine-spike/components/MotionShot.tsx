import { animate } from 'motion'
import type { AnimationPlaybackControlsWithThen } from 'motion'
import { useEffect, useRef, useState } from 'react'

import {
  SHOT,
  SHOT_MS,
  scaleTransform,
  shiftTransform,
  spinTransform,
} from '../shot.timeline'
import { ShotStage } from './ShotStage'

const part = (root: HTMLElement, name: string): HTMLElement | null =>
  root.querySelector<HTMLElement>(`[data-shot="${name}"]`)

// The shot with Motion: one `animate()` sequence, each segment placed `at` its
// start ms. Transform strings, so every segment is a WAAPI animation on the
// compositor; the sequence only schedules them.
const play = (root: HTMLElement): AnimationPlaybackControlsWithThen | null => {
  const camera = part(root, 'camera')
  const pan = part(root, 'pan')
  const sleeve = part(root, 'sleeve')
  const disc = part(root, 'disc')
  const spin = part(root, 'spin')
  const sweep = part(root, 'sweep')
  if (!camera || !pan || !sleeve || !disc || !spin || !sweep) return null

  const at = (m: { start: number }) => m.start / 1000
  const over = (m: { start: number; end: number }) => (m.end - m.start) / 1000

  return animate(
    [
      [
        camera,
        {
          transform: [
            scaleTransform(SHOT.push.from),
            scaleTransform(SHOT.push.to),
          ],
        },
        { at: at(SHOT.push), duration: over(SHOT.push), ease: SHOT.push.ease },
      ],
      // Its own layer: two tweens on one element's `transform` would replace
      // each other, WAAPI keeps only the last
      [
        pan,
        {
          transform: [
            shiftTransform(SHOT.pan.from),
            shiftTransform(SHOT.pan.to),
          ],
        },
        { at: at(SHOT.pan), duration: over(SHOT.pan), ease: SHOT.pan.ease },
      ],
      [
        sleeve,
        {
          transform: [
            shiftTransform(SHOT.sleeveX.from),
            shiftTransform(SHOT.sleeveX.to),
          ],
        },
        {
          at: at(SHOT.sleeveX),
          duration: over(SHOT.sleeveX),
          ease: SHOT.sleeveX.ease,
        },
      ],
      [
        disc,
        {
          transform: [
            shiftTransform(SHOT.discX.from),
            shiftTransform(SHOT.discX.to),
          ],
        },
        {
          at: at(SHOT.discX),
          duration: over(SHOT.discX),
          ease: SHOT.discX.ease,
        },
      ],
      [
        spin,
        {
          transform: [
            spinTransform(SHOT.spin.from),
            spinTransform(SHOT.spin.to),
          ],
        },
        { at: 0, duration: SHOT_MS / 1000, ease: 'linear' },
      ],
      [
        sweep,
        {
          transform: [
            shiftTransform(SHOT.sweepX.from),
            shiftTransform(SHOT.sweepX.to),
          ],
        },
        {
          at: at(SHOT.sweepX),
          duration: over(SHOT.sweepX),
          ease: SHOT.sweepX.ease,
        },
      ],
      [
        sweep,
        { opacity: [SHOT.sweepIn.from, SHOT.sweepIn.to] },
        {
          at: at(SHOT.sweepIn),
          duration: over(SHOT.sweepIn),
          ease: SHOT.sweepIn.ease,
        },
      ],
      [
        sweep,
        { opacity: [SHOT.sweepOut.from, SHOT.sweepOut.to] },
        {
          at: at(SHOT.sweepOut),
          duration: over(SHOT.sweepOut),
          ease: SHOT.sweepOut.ease,
        },
      ],
    ],
    { repeat: Infinity },
  )
}

export const MotionShot = () => {
  const stage = useRef<HTMLDivElement>(null)
  const controls = useRef<AnimationPlaybackControlsWithThen | null>(null)
  const scrub = useRef<HTMLInputElement>(null)
  const [playing, setPlaying] = useState(true)

  useEffect(() => {
    const root = stage.current
    if (!root) return
    const anim = play(root)
    controls.current = anim
    let raf = 0
    const tick = () => {
      if (anim && scrub.current) {
        scrub.current.value = String(Math.round((anim.time * 1000) % SHOT_MS))
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      anim?.cancel()
      controls.current = null
    }
  }, [])

  return (
    <div className="flex flex-col gap-3">
      <div ref={stage}>
        <ShotStage />
      </div>
      <div className="flex items-center gap-3 text-sm">
        <button
          type="button"
          className="rounded border px-3 py-1"
          onClick={() => {
            const anim = controls.current
            if (!anim) return
            if (playing) anim.pause()
            else anim.play()
            setPlaying(!playing)
          }}
        >
          {playing ? 'Pause' : 'Play'}
        </button>
        <input
          ref={scrub}
          type="range"
          min={0}
          max={SHOT_MS}
          defaultValue={0}
          className="flex-1"
          aria-label="Scrub Motion version"
          onChange={(e) => {
            const anim = controls.current
            if (!anim) return
            anim.pause()
            anim.time = Number(e.currentTarget.value) / 1000
            setPlaying(false)
          }}
        />
      </div>
    </div>
  )
}
