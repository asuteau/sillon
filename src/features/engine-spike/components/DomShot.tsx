import { animate } from 'motion'
import type {
  AnimationPlaybackControlsWithThen,
  AnimationSequence,
} from 'motion'
import { useEffect, useMemo, useRef, useState } from 'react'
import type * as React from 'react'

import { GeneratedCover } from '#/features/landing/components/GeneratedCover'
import {
  HERO_CAST,
  LANDING_RECORDS,
  heroTint,
  landingPressing,
  pressingSurface,
} from '#/features/landing/content/landing.content'
import { coverArt } from '#/features/landing/cover-art.utils'
import { Disc } from '#/shared/components/brand/Disc'

import { CRAFT_MS, DISC, SET, SLEEVE, SPIN_DEG_PER_S } from '../craft.score'
import type { Framing, SetSleeve } from '../craft.score'
import { bakeDom } from '../dom-bake'
import { LOOP_MS } from '../shot-clock'
import { STAGE_MASK } from '../stage-mask'
import type { ShotClock } from '../shot-clock'

const castOf = (slot: number) => {
  const { index, tintHue } = HERO_CAST[slot]
  const pressing = landingPressing(index)
  return {
    record: LANDING_RECORDS[index],
    pressing,
    tint: heroTint(tintHue),
    surface: pressingSurface(pressing),
    ground: {
      light: coverArt(pressing.id, 'light').ground,
      dark: coverArt(pressing.id, 'dark').ground,
    },
  }
}

const HERO = castOf(SET[0].cast)

const abs: React.CSSProperties = { position: 'absolute' }
const p3d: React.CSSProperties = { transformStyle: 'preserve-3d' }

// Centred on its parent's origin, w × h px
const box = (w: number, h: number): React.CSSProperties => ({
  ...abs,
  left: -w / 2,
  top: -h / 2,
  width: w,
  height: h,
})

interface SleeveProps {
  sleeve: SetSleeve
  unit: number
}

// A sleeve with thickness: printed front, three edges (the right one is the
// open mouth), each face shaded by the key light and blurred by the lens
const Sleeve = ({ sleeve, unit }: SleeveProps) => {
  const { record, pressing, ground } = castOf(sleeve.cast)
  const depth = Math.max(2, SLEEVE.depth * unit)
  const edge = {
    '--edge-light': `color-mix(in oklab, ${ground.light} 82%, black)`,
    '--edge-dark': `color-mix(in oklab, ${ground.dark} 70%, black)`,
  }
  const k = sleeve.key
  const shade = (face: string) => (
    <div
      data-part={`${k}-shade-${face}`}
      className="absolute inset-0 bg-black"
      style={{ opacity: 0.2 }}
    />
  )
  return (
    <>
      <div
        data-part={`${k}-dof`}
        className="overflow-hidden rounded-[3px]"
        style={{
          ...box(unit, unit),
          transform: `translateZ(${depth / 2}px)`,
          backfaceVisibility: 'hidden',
        }}
      >
        <GeneratedCover
          artist={record.artist}
          title={record.title}
          seed={pressing.id}
          className="size-full rounded-none"
        />
        {shade('front')}
        <div
          data-part={`${k}-gloss`}
          style={{
            ...abs,
            top: 0,
            height: unit,
            width: unit * 1.1,
            left: unit / 2 - unit * 0.55,
            // The strip softbox's reflection: a hot core in a soft falloff
            background:
              'linear-gradient(90deg, transparent, oklch(1 0 0 / 0.08) 25%, oklch(1 0 0 / 0.34) 47% 53%, oklch(1 0 0 / 0.08) 75%, transparent)',
            mixBlendMode: 'plus-lighter',
            opacity: 0,
          }}
        />
      </div>
      <div
        data-part={`${k}-dof`}
        className="bg-(--edge-light) dark:bg-(--edge-dark)"
        style={{
          ...box(depth, unit),
          ...edge,
          transform: `translateX(${-unit / 2}px) rotateY(-90deg)`,
        }}
      >
        {shade('left')}
      </div>
      <div
        data-part={`${k}-dof`}
        className="bg-(--edge-light) dark:bg-(--edge-dark)"
        style={{
          ...box(unit, depth),
          ...edge,
          transform: `translateY(${-unit / 2}px) rotateX(90deg)`,
        }}
      >
        {shade('top')}
      </div>
      {/* The mouth: the dark inside of the sleeve */}
      <div
        data-part={`${k}-dof`}
        style={{
          ...box(depth, unit * 0.995),
          background: 'oklch(0.12 0 0)',
          transform: `translateX(${unit / 2}px) rotateY(90deg)`,
        }}
      />
    </>
  )
}

// The disc with thickness: two plain layers under the grooved face. The
// sheen is the light's, not the record's: it sits outside the turn
const DiscBody = ({ unit }: { unit: number }) => {
  const size = DISC.diameter * unit
  const depth = Math.max(2, DISC.depth * unit)
  const layer = (z: number) => (
    <div
      data-part="disc-dof"
      className="rounded-full"
      style={{
        ...box(size, size),
        transform: `translateZ(${z}px)`,
        background: `color-mix(in oklab, ${HERO.surface.background} 70%, black)`,
      }}
    />
  )
  return (
    <>
      {layer(-depth / 2)}
      {layer(0)}
      <div
        data-part="disc-dof"
        className="rounded-full"
        style={{
          ...box(size, size),
          transform: `translateZ(${depth / 2}px)`,
          '--cover-tint': HERO.tint,
        }}
      >
        <div
          data-part="disc-spin"
          className="absolute inset-0 [&_.disc]:inset-0 [&_.disc]:shadow-none [&_.disc-sheen]:hidden"
        >
          <Disc
            surface={HERO.surface.background}
            seeThrough={HERO.surface.seeThrough}
          />
        </div>
        {/* Grooves facing away from the light go dark */}
        <div
          data-part="disc-sheen"
          className="absolute inset-0 rounded-full"
          style={{
            mixBlendMode: 'multiply',
            background:
              'conic-gradient(transparent 20deg, oklch(0 0 0 / 0.32) 90deg, transparent 160deg 200deg, oklch(0 0 0 / 0.32) 270deg, transparent 340deg)',
          }}
        />
        <div
          data-part="disc-sheen"
          className="absolute inset-0 rounded-full"
          style={{
            mixBlendMode: 'plus-lighter',
            opacity: 0.3,
            maskImage: 'radial-gradient(circle, transparent 34%, black 37%)',
          }}
        >
          {/* Bloom: the streak, wide and soft, then sharp */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background:
                'conic-gradient(oklch(1 0 0 / 0.7), oklch(1 0 0 / 0.22) 10deg, transparent 32deg 148deg, oklch(1 0 0 / 0.22) 170deg, oklch(1 0 0 / 0.7) 180deg, oklch(1 0 0 / 0.22) 190deg, transparent 212deg 328deg, oklch(1 0 0 / 0.22) 350deg)',
              filter: `blur(${unit * 0.03}px)`,
            }}
          />
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background:
                'conic-gradient(oklch(1 0 0 / 0.85), transparent 3deg 177deg, oklch(1 0 0 / 0.85) 180deg, transparent 183deg 357deg)',
              maskImage:
                'radial-gradient(circle, transparent 33%, black 36% 97%, transparent 99%)',
            }}
          />
        </div>
      </div>
    </>
  )
}

interface FloorProps {
  unit: number
}

// The page ground as a floor: contact shadows and soft cast shadows that
// move away from the key light
const Floor = ({ unit }: FloorProps) => (
  <div
    style={{
      ...abs,
      ...p3d,
      transform: `translate3d(0px, ${unit / 2}px, 0px) rotateX(90deg)`,
    }}
  >
    {SET.map((sleeve) => {
      const k = sleeve.key
      const contact = (
        <>
          <div
            data-part={`${k}-cast`}
            style={{
              ...box(unit * 1.25, unit * 0.5),
              background:
                'radial-gradient(closest-side, var(--pull-shadow), transparent)',
              opacity: 0.55,
            }}
          />
          <div
            style={{
              ...box(unit * 1.06, unit * 0.09),
              background:
                'radial-gradient(closest-side, oklch(0 0 0 / 0.45), transparent)',
            }}
          />
        </>
      )
      return (
        <div
          key={k}
          style={{
            ...abs,
            transform: `translate(${sleeve.x * unit}px, ${sleeve.z * unit}px) rotate(${-sleeve.yaw}deg)`,
          }}
        >
          {k === 'hero' ? (
            <>
              <div data-part="hero-move" style={abs}>
                {contact}
              </div>
              <div
                data-part="disc-shadow"
                style={{
                  ...box(unit * 0.95, unit * 0.22),
                  background:
                    'radial-gradient(closest-side, var(--pull-shadow), transparent)',
                }}
              />
            </>
          ) : (
            contact
          )}
        </div>
      )
    })}
  </div>
)

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

interface DomShotProps {
  framing: Framing
  clock: ShotClock
}

// Variant A: the shot in the DOM. CSS 3D for the set and the camera rig,
// the score baked into WAAPI keyframes that Motion plays as one sequence.
export const DomShot = ({ framing, clock }: DomShotProps) => {
  const stage = useRef<HTMLDivElement>(null)
  const size = useStageSize(stage)
  const bake = useMemo(
    () => (size ? bakeDom({ ...size, framing }) : null),
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
        { at: 0, duration: CRAFT_MS / 1000, ease: 'linear' },
      ])
    }
    const spin = root.querySelector<HTMLElement>('[data-part="disc-spin"]')
    if (spin) {
      sequence.push([
        spin,
        {
          transform: [
            'rotate(0deg)',
            `rotate(${(SPIN_DEG_PER_S * LOOP_MS) / 1000}deg)`,
          ],
        },
        { at: 0, duration: LOOP_MS / 1000, ease: 'linear' },
      ])
    }
    const anim: AnimationPlaybackControlsWithThen = animate(sequence, {
      repeat: Infinity,
    })
    // Time to play, read by the DevTools probe
    performance.mark('shot:dom:playing')
    const sync = () => {
      anim.time = clock.ms() / 1000
      if (clock.playing()) anim.play()
      else anim.pause()
    }
    sync()
    const unsubscribe = clock.subscribe(sync)
    return () => {
      unsubscribe()
      anim.cancel()
    }
  }, [bake, clock])

  const unit = bake?.unit ?? 0
  return (
    <div
      ref={stage}
      aria-hidden
      className="relative w-full overflow-hidden bg-background select-none"
      style={{
        aspectRatio: framing === 'wide' ? '16 / 9' : '4 / 5',
        perspective: bake ? `${bake.perspective}px` : undefined,
        maskImage: STAGE_MASK,
        maskComposite: 'intersect',
      }}
    >
      {bake && (
        <div
          data-part="world"
          style={{ ...abs, ...p3d, left: '50%', top: '50%' }}
        >
          <Floor unit={unit} />
          {SET.map((sleeve) => (
            <div
              key={sleeve.key}
              style={{
                ...abs,
                ...p3d,
                transform: `translate3d(${sleeve.x * unit}px, 0px, ${sleeve.z * unit}px) rotateY(${sleeve.yaw}deg)`,
              }}
            >
              {sleeve.key === 'hero' ? (
                <>
                  <div data-part="disc-move" style={{ ...abs, ...p3d }}>
                    <DiscBody unit={unit} />
                  </div>
                  <div data-part="hero-move" style={{ ...abs, ...p3d }}>
                    <Sleeve sleeve={sleeve} unit={unit} />
                  </div>
                </>
              ) : (
                <Sleeve sleeve={sleeve} unit={unit} />
              )}
            </div>
          ))}
        </div>
      )}
      <div
        data-part="exposure"
        className="pointer-events-none absolute inset-0 bg-background"
      />
    </div>
  )
}
