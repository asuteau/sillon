import { animate } from 'motion'
import type { AnimationSequence } from 'motion'
import { useEffect, useMemo, useRef, useState } from 'react'
import type * as React from 'react'

import { SPIN_DEG_PER_S } from '#/features/engine-spike/craft.score'
import { STAGE_MASK } from '#/features/engine-spike/stage-mask'

import type { StoryClock } from '../story-clock'
import { bakeStory } from '../storyboard.bake'
import { LAYOUT, STORY_MS } from '../storyboard.score'
import type { Framing } from '../storyboard.score'
import { StackHud, StoryboardSet, abs, p3d } from './StoryboardSet'

const useStageSize = (ref: React.RefObject<HTMLDivElement | null>) => {
  const [size, setSize] = useState<{ width: number; height: number } | null>(
    null,
  )
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      setSize({ width: Math.round(width), height: Math.round(height) })
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [ref])
  return size
}

interface StoryboardFilmProps {
  framing: Framing
  clock: StoryClock
  children?: React.ReactNode
}

// The hero film as a storyboard: CSS 3D for the set and the camera rig, the
// score baked into WAAPI keyframes that Motion plays as one sequence, kept
// on the page's clock so it scrubs
export const StoryboardFilm = ({
  framing,
  clock,
  children,
}: StoryboardFilmProps) => {
  const stage = useRef<HTMLDivElement>(null)
  const size = useStageSize(stage)
  const { centre } = LAYOUT[framing]
  const bake = useMemo(
    () => (size ? bakeStory({ ...size, framing }) : null),
    [size, framing],
  )

  useEffect(() => {
    const root = stage.current
    if (!root || !bake) return
    const sequence: AnimationSequence = []
    for (const [name, keyframes] of Object.entries(bake.tracks)) {
      const els = root.querySelectorAll<HTMLElement>(`[data-part="${name}"]`)
      if (els.length === 0) continue
      sequence.push([
        Array.from(els),
        { ...keyframes },
        { at: 0, duration: STORY_MS / 1000, ease: 'linear' },
      ])
    }
    const spin = root.querySelector<HTMLElement>('[data-part="disc-spin"]')
    if (spin) {
      sequence.push([
        spin,
        {
          transform: [
            'rotate(0deg)',
            `rotate(${(SPIN_DEG_PER_S * STORY_MS) / 1000}deg)`,
          ],
        },
        { at: 0, duration: STORY_MS / 1000, ease: 'linear' },
      ])
    }
    const anim = animate(sequence, { repeat: Infinity })
    const sync = () => {
      anim.time = clock.ms() / 1000
      if (clock.playing()) anim.play()
      else anim.pause()
    }
    sync()
    const unsubscribe = clock.subscribe(sync)
    // Motion starts its animations a frame or more after `animate()`, and
    // hundreds of them block for a moment: keep the film on the page's clock
    const drift = window.setInterval(() => {
      const ms = clock.ms()
      if (Math.abs(anim.time * 1000 - ms) > 60) sync()
    }, 250)
    return () => {
      window.clearInterval(drift)
      unsubscribe()
      anim.cancel()
    }
  }, [bake, clock])

  return (
    <div
      ref={stage}
      className="relative w-full overflow-hidden bg-background select-none"
      style={{ aspectRatio: framing === 'wide' ? '16 / 9' : '4 / 5' }}
    >
      <div
        aria-hidden
        className="absolute inset-0 bg-background"
        style={{
          perspective: bake ? `${bake.perspective}px` : undefined,
          perspectiveOrigin: `${centre * 100}% 50%`,
          maskImage: STAGE_MASK,
          maskComposite: 'intersect',
        }}
      >
        {bake && (
          <div
            data-part="world"
            style={{ ...abs, ...p3d, left: `${centre * 100}%`, top: '50%' }}
          >
            <StoryboardSet unit={bake.unit} layout={LAYOUT[framing]} />
          </div>
        )}
        {/* The Challenge's cold grade: colour drained, a cool cast */}
        <div
          data-part="grade"
          className="pointer-events-none absolute inset-0 bg-[oklch(0.6_0_0)] mix-blend-saturation"
        />
        <div
          data-part="exposure"
          className="pointer-events-none absolute inset-0 bg-background"
        />
      </div>
      <StackHud centre={centre} />
      {children}
    </div>
  )
}
