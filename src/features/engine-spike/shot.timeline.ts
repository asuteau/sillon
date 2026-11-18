// The spike's one shot, as numbers. Both engines read these and each writes
// its own idiomatic driver: Motion `animate()` sequences, Remotion
// `interpolate()` per frame. Positions in % of the sleeve, times in ms.

type Bezier = readonly [number, number, number, number]

// Same curves as the hero film (design system §5)
export const EASE = {
  platter: [0.65, 0, 0.15, 1],
  out: [0.16, 1, 0.3, 1],
  inOut: [0.45, 0, 0.1, 1],
  linear: [0, 0, 1, 1],
} as const satisfies Record<string, Bezier>

export const SHOT_MS = 10_000
export const SHOT_FPS = 60

// The record that plays: HERO_CAST[0] (a Vinyl colour with a label tint)
export const SHOT_CAST = 0

interface Move {
  start: number
  end: number
  from: number
  to: number
  ease: Bezier
}

export const SHOT = {
  // Camera push into the Cover, scale about the sleeve's centre
  push: { start: 0, end: 7500, from: 0.72, to: 1.15, ease: EASE.inOut },
  // The pair re-centres as the disc comes out (camera pan, % of the stage, on its own layer so it never fights the push)
  pan: { start: 2000, end: 5200, from: 0, to: -11, ease: EASE.platter },
  // The sleeve eases left, the disc slides out right (% of the sleeve)
  sleeveX: { start: 2200, end: 4400, from: 0, to: -14, ease: EASE.out },
  discX: { start: 2000, end: 5200, from: 0, to: 64, ease: EASE.platter },
  // One turn per 1.9s, linear, from the start (hidden until the disc is out)
  spin: {
    start: 0,
    end: SHOT_MS,
    from: 0,
    to: (SHOT_MS / 1900) * 360,
    ease: EASE.linear,
  },
  // Light: a soft band crosses the Cover, fading in and out as it goes
  sweepX: { start: 5200, end: 8400, from: -110, to: 190, ease: EASE.inOut },
  sweepIn: { start: 5200, end: 5700, from: 0, to: 1, ease: EASE.out },
  sweepOut: { start: 7700, end: 8400, from: 1, to: 0, ease: EASE.inOut },
} as const satisfies Record<string, Move>

export const scaleTransform = (scale: number): string => `scale(${scale})`

export const shiftTransform = (x: number): string => `translateX(${x}%)`

export const spinTransform = (deg: number): string => `rotate(${deg}deg)`
