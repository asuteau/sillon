// The Portrait loop, as a score (film/film.model.ts): the Portrait sheet
// seen at an angle, the camera easing round to face it while the Top artists
// bars draw in, one after another, and the leader's turns copper; the focus
// racks down to Pressing decade, whose columns draw up and whose leader turns
// copper too. A hold on the whole sheet; then the bars fade, the camera
// swings back, and the bars are undrawn while nothing shows them.
import { leaderCount } from '#/features/portrait/portrait.utils'

import { LANDING_PORTRAIT } from './content/landing.content'
import { CURVES, round3, sharpness, track } from './film/film.model'
import type { Key, Look, Score, Shot } from './film/film.model'

export const PORTRAIT_LOOP_MS = 9600

const { topArtists, pressingDecades } = LANDING_PORTRAIT

// Which row and column lead (copper), as the charts work it out
const leaderIndex = (counts: readonly number[]) =>
  counts.indexOf(leaderCount([...counts]) ?? -1)
export const ARTIST_LEADER = leaderIndex(topArtists.map((a) => a.copies))
export const DECADE_LEADER = leaderIndex(pressingDecades.map((d) => d.copies))

export const PORTRAIT_TRACK_NAMES = [
  // The camera, on the whole sheet
  'page',
  // Light falling off as the sheet turns away
  'shade',
  // The sheet's three parts, for the rack focus: each dims while out of
  // focus; the figures and Pressing decade go soft, the sharp part giving
  // way to its soft twin
  'figures',
  'figures:sharp',
  'figures:soft',
  'artists',
  'decades',
  'decades:sharp',
  'decades:soft',
  ...topArtists.map((_, i) => `artistBar:${i}` as const),
  ...pressingDecades.map((_, i) => `decadeBar:${i}` as const),
  // Each column's count, over it
  ...pressingDecades.map((_, i) => `decadeCount:${i}` as const),
] as const

export type PortraitTrack = (typeof PORTRAIT_TRACK_NAMES)[number]

// Beats, ms into the loop
const DRAW_MS = 800
const ARTISTS_FROM = 700
const ARTIST_STAGGER = 110
const ARTIST_COPPER = [1900, 2700] as const
const DECADES_FROM = 3100
const DECADE_STAGGER = 90
const DECADE_COPPER = [4300, 5100] as const
// The bars fade, then are undrawn unseen. The leaders' copper clears the
// moment they're hidden: drawn on the main thread, it can run behind the
// bars, and gets the whole hidden stretch to catch up
const FADE = [8000, 8500] as const
const UNDRAW_MS = 8800

// The camera: tilted away and turned left, easing round to face the sheet
// as the focus moves down it; then back
const CAMERA: Record<'rx' | 'ry' | 'y' | 's', readonly Key[]> = {
  rx: [
    [0, 24, CURVES.dolly],
    [2600, 12, CURVES.dolly],
    [4800, 6, CURVES.dolly],
    [6400, 3],
    [8000, 3, CURVES.dolly],
    [PORTRAIT_LOOP_MS, 24],
  ],
  ry: [
    [0, -18, CURVES.dolly],
    [2600, -8, CURVES.dolly],
    [4800, 5, CURVES.dolly],
    [6400, 2],
    [8000, 0, CURVES.dolly],
    [PORTRAIT_LOOP_MS, -18],
  ],
  y: [
    [0, 3, CURVES.dolly],
    [2600, 2, CURVES.dolly],
    [4800, -1, CURVES.dolly],
    [6400, 0],
    [8000, 0, CURVES.dolly],
    [PORTRAIT_LOOP_MS, 3],
  ],
  s: [
    [0, 0.86, CURVES.dolly],
    [2600, 0.91, CURVES.dolly],
    [4800, 0.94, CURVES.dolly],
    [6400, 0.95],
    [8000, 0.95, CURVES.dolly],
    [PORTRAIT_LOOP_MS, 0.86],
  ],
}

const rx = track(CAMERA.rx)
const ry = track(CAMERA.ry)
const camY = track(CAMERA.y)
const camS = track(CAMERA.s)

// The soft twins' static blur, stage units
export const PORTRAIT_SOFT_BLUR = 0.3

// Out of focus: how soft a part is over time (0 sharp, 1 softest), as a
// dimming of the part and its soft twin faded in over it. A blur repaints
// whatever moves inside it: only parts that hold still while soft get a
// twin
const focus = (keys: readonly Key[]) => {
  const softness = track(keys)
  return (ms: number) => {
    const soft = softness(ms)
    return {
      part: { opacity: round3(1 - soft * 0.3) },
      sharp: { opacity: round3(sharpness(soft)) },
      soft: { opacity: round3(soft) },
    }
  }
}

// The focus racks down the sheet: Top artists while its bars draw, Pressing
// decade while its columns do, then all of it for the hold; soft again as
// the camera swings back. Top artists only dims: its bars move while it's
// soft
const FOCUS = {
  figures: focus([
    [0, 1],
    [4800, 1, CURVES.fade],
    [5400, 0],
    [8600, 0, CURVES.fade],
    [PORTRAIT_LOOP_MS, 1],
  ]),
  artists: focus([
    [0, 1, CURVES.inOut],
    [600, 0],
    [2800, 0, CURVES.inOut],
    [3400, 0.8],
    [4800, 0.8, CURVES.fade],
    [5400, 0],
    [8600, 0, CURVES.fade],
    [PORTRAIT_LOOP_MS, 1],
  ]),
  decades: focus([
    [0, 1],
    [2600, 1, CURVES.inOut],
    [3200, 0],
    [8600, 0, CURVES.fade],
    [PORTRAIT_LOOP_MS, 1],
  ]),
}

// A bar: drawn in from `from` (platter), copper drawn over it (the
// leader's), faded out with the rest and undrawn unseen
const bar = (
  axis: 'scaleX' | 'scaleY',
  from: number,
  copper?: readonly [number, number],
) => {
  const scale = track([
    [from, 0, CURVES.platter],
    [from + DRAW_MS, 1],
    [UNDRAW_MS, 1],
    [UNDRAW_MS + 1, 0],
  ])
  const opacity = track([
    [FADE[0], 1, CURVES.fade],
    [FADE[1], 0],
    [UNDRAW_MS, 0],
    [UNDRAW_MS + 1, 1],
  ])
  const draw =
    copper &&
    track([
      [copper[0], 0, CURVES.platter],
      [copper[1], 1],
      [FADE[1], 1],
      [FADE[1] + 1, 0],
    ])
  return (ms: number): Look => ({
    opacity: round3(opacity(ms)),
    transform:
      axis === 'scaleX'
        ? [{ scaleX: round3(scale(ms)) }]
        : [{ scaleY: round3(scale(ms)) }],
    ...(draw && { draw: round3(draw(ms)) }),
  })
}

// A column's count: fades in as its column tops out, out with the bars
const count = (from: number) => {
  const opacity = track([
    [from + DRAW_MS / 2, 0, CURVES.fade],
    [from + DRAW_MS, 1],
    [FADE[0], 1, CURVES.fade],
    [FADE[1], 0],
  ])
  return (ms: number): Look => ({ opacity: round3(opacity(ms)) })
}

const CHART_TRACKS = [
  ...pressingDecades.map(
    (_, i) =>
      [`decadeCount:${i}`, count(DECADES_FROM + i * DECADE_STAGGER)] as const,
  ),
  ...topArtists.map(
    (_, i) =>
      [
        `artistBar:${i}`,
        bar(
          'scaleX',
          ARTISTS_FROM + i * ARTIST_STAGGER,
          i === ARTIST_LEADER ? ARTIST_COPPER : undefined,
        ),
      ] as const,
  ),
  ...pressingDecades.map(
    (_, i) =>
      [
        `decadeBar:${i}`,
        bar(
          'scaleY',
          DECADES_FROM + i * DECADE_STAGGER,
          i === DECADE_LEADER ? DECADE_COPPER : undefined,
        ),
      ] as const,
  ),
]

export const PORTRAIT_SCORE: Score<PortraitTrack> = {
  tracks: PORTRAIT_TRACK_NAMES,
  length: PORTRAIT_LOOP_MS,
  ending: { kind: 'loop', from: 0 },
  // Reduced motion: the hold, every bar drawn, the leaders copper, the sheet
  // almost square to the camera
  still: 7000,
  // The copper clearing, then the bars undrawn
  cuts: [FADE[1], FADE[1] + 1, UNDRAW_MS, UNDRAW_MS + 1],
  sample: (ms) => {
    const tilt = Math.abs(rx(ms)) + Math.abs(ry(ms))
    const shot: Shot<PortraitTrack> = {
      page: {
        transform: [
          { perspective: 1600 },
          { translate: [0, round3(camY(ms))] },
          { rotateX: round3(rx(ms)) },
          { rotateY: round3(ry(ms)) },
          { scale: round3(camS(ms)) },
        ],
      },
      shade: { opacity: round3(Math.min(1, tilt / 42)) },
    }
    for (const part of ['figures', 'decades'] as const) {
      const { part: dim, sharp, soft } = FOCUS[part](ms)
      shot[part] = dim
      shot[`${part}:sharp`] = sharp
      shot[`${part}:soft`] = soft
    }
    shot.artists = FOCUS.artists(ms).part
    for (const [name, look] of CHART_TRACKS) shot[name] = look(ms)
    return shot
  },
}
