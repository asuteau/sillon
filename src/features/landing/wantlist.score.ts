// The Wantlist section's loop (#118) as a score (film/film.model.ts): a want
// becomes a fulfilled want, and Sillon offers to take it off the Wantlist.
//
// One set under one lens: the Wantlist far back, the Record screen near. The
// camera opens pushed in on the Wantlist, the want lifting off it; it pulls
// back through the Record screen, which comes into focus as it passes; the
// exact release is added (Owned), the prompt rises, Remove is pressed; the
// camera pushes back in, through the screen, to the Wantlist, where the want
// folds away and the count drops. The set fades to the page ground and the
// loop comes round in the dark, the want back in its place.
import { CURVES, round3, sharpness, track } from './film/film.model'
import type { Look, Score, Shot } from './film/film.model'

export const WANTLIST_LOOP_MS = 10_000

// The story's beats, ms into the loop
export const WANTLIST_BEATS = [
  // On the Wantlist, the want lifts off it
  { name: 'want', at: 0 },
  // The Collection toggle pressed: Owned
  { name: 'added', at: 4100 },
  // "Now in your collection. It's still on your wantlist. Remove it?"
  { name: 'fulfilled', at: 4600 },
  // Remove pressed
  { name: 'removed', at: 6000 },
  // Back on the Wantlist, the want folds away
  { name: 'offWantlist', at: 8200 },
] as const

const AT = {
  added: WANTLIST_BEATS[1].at,
  fulfilled: WANTLIST_BEATS[2].at,
  removed: WANTLIST_BEATS[3].at,
  offWantlist: WANTLIST_BEATS[4].at,
}

export const WANTLIST_TRACKS = [
  // Fade up from the page ground, and down to it for the wrap
  'exposure',
  // The world's inverse: dolly (z), pan, pitch and yaw about the stage
  'camera',
  // The Wantlist plane, far back: in focus only while the camera is on it,
  // its sharp copy giving way to its soft twin
  'wantlist',
  'wantlist:sharp',
  'wantlist:soft',
  // The want: lifts off the list, then folds away
  'want',
  // The other wants dim while the want lifts
  'others',
  // The Wantlist's count, before and after
  'count:3',
  'count:2',
  // The Record screen plane, near, out of its soft twin as the camera
  // passes through it
  'screen',
  'screen:sharp',
  'screen:soft',
  // The key light's sheen across the Cover
  'sheen',
  'heading',
  // The Collection toggle, before and after; the press on it
  'unowned',
  'owned',
  'press',
  // The fulfilled want's prompt; the press on Remove
  'prompt',
  'remove',
] as const

export type WantlistTrack = (typeof WANTLIST_TRACKS)[number]

// How far behind the Record screen the Wantlist stands, stage units: the
// camera dollies this far in to frame it
export const WANTLIST_DEPTH = 36

// The soft twins' static blur, stage units: the Wantlist behind the screen,
// and the screen the camera passes through, closer to the lens
export const WANTLIST_SOFT_BLUR = { wantlist: 1.5, screen: 3 } as const

const { platter, fade, out, inOut, dolly } = CURVES

const L = WANTLIST_LOOP_MS
// Camera pulls back to the Record screen, then pushes in to the Wantlist
const PULL = [1500, 3300] as const
const PUSH = [6300, 7900] as const

const curves = {
  exposure: track([
    [0, 0, out],
    [600, 1],
    [L - 650, 1, fade],
    [L, 0],
  ]),

  // Dolly: in on the Wantlist, back past the screen a touch, settle, in again
  camZ: track([
    [0, WANTLIST_DEPTH],
    [PULL[0], WANTLIST_DEPTH - 1.5, dolly],
    [PULL[1], -2.5, out],
    [PULL[1] + 900, 0],
    [PUSH[0], 0.6, dolly],
    [PUSH[1], WANTLIST_DEPTH + 1, out],
    [PUSH[1] + 900, WANTLIST_DEPTH],
    [L, WANTLIST_DEPTH],
  ]),
  camX: track([
    [0, -4],
    [PULL[0], -3.4, inOut],
    [PULL[1] + 400, -1, inOut],
    [PUSH[0], 0.6, inOut],
    [PUSH[1] + 400, -4.4, inOut],
    [L, -4],
  ]),
  // Turned left on the Wantlist, swinging right across to the screen
  yaw: track([
    [0, -11],
    [PULL[0] - 300, -9, inOut],
    [PULL[1] + 300, 7],
    [PUSH[0], 4.5, inOut],
    [PUSH[1] + 300, -10],
    [L, -11],
  ]),
  pitch: track([
    [0, 9],
    [PULL[0], 8, inOut],
    [PULL[1] + 300, 3],
    [PUSH[0], 2.5, inOut],
    [PUSH[1] + 300, 9],
    [L, 9],
  ]),

  // Rack focus: the Wantlist sharp while framed, soft and dim behind the
  // screen
  listSoft: track([
    [0, 0],
    [PULL[0] + 200, 0, inOut],
    [PULL[1], 1],
    [PUSH[0] + 300, 1, inOut],
    [PUSH[1], 0],
  ]),
  listDim: track([
    [0, 1],
    [PULL[0] + 200, 1, inOut],
    [PULL[1], 0.3],
    [PUSH[0] + 300, 0.3, inOut],
    [PUSH[1], 1],
  ]),
  // The want lifts toward the lens; folds away once back on the list
  wantLift: track([
    [0, 0],
    [500, 0, out],
    [1300, 3],
    [AT.offWantlist, 3, platter],
    [AT.offWantlist + 500, 0],
  ]),
  wantFold: track([
    [0, 0],
    [AT.offWantlist + 200, 0, platter],
    [AT.offWantlist + 900, -88],
  ]),
  wantFade: track([
    [0, 1],
    [AT.offWantlist + 450, 1, fade],
    [AT.offWantlist + 800, 0],
  ]),
  othersDim: track([
    [0, 1],
    [500, 1, out],
    [1300, 0.45],
    [AT.offWantlist, 0.45, fade],
    [AT.offWantlist + 600, 1],
  ]),
  count: track([
    [0, 0],
    [AT.offWantlist + 500, 0, fade],
    [AT.offWantlist + 800, 1],
  ]),

  // The screen comes out of the blur as the camera passes through it; it
  // goes back into it on the way in
  screenFade: track([
    [0, 0],
    [PULL[0] + 300, 0, fade],
    [PULL[0] + 1300, 1],
    [PUSH[0] + 300, 1, fade],
    [PUSH[0] + 1200, 0],
  ]),
  screenSoft: track([
    [0, 1],
    [PULL[0] + 300, 1, out],
    [PULL[1] + 100, 0],
    [PUSH[0], 0, inOut],
    [PUSH[0] + 1200, 1],
  ]),
  // The key sweeps across the Cover as the record is added
  sheen: track([
    [0, -140],
    [AT.added - 300, -140, inOut],
    [AT.added + 1500, 140],
  ]),
  heading: track([
    [0, 0],
    [PULL[0] + 900, 0, out],
    [PULL[0] + 1700, 1],
  ]),
  owned: track([
    [0, 0],
    [AT.added, 0, fade],
    [AT.added + 160, 1],
  ]),
  press: track([
    [0, 1],
    [AT.added - 220, 1, out],
    [AT.added - 60, 0.94, out],
    [AT.added + 260, 1],
  ]),
  prompt: track([
    [0, 0],
    [AT.fulfilled, 0, out],
    [AT.fulfilled + 600, 1],
  ]),
  remove: track([
    [0, 1],
    [AT.removed - 200, 1, out],
    [AT.removed - 40, 0.94, out],
    [AT.removed + 280, 1],
  ]),
}

// A rise: up from 2 units below as it shows
const rise = (shown: number): Look => ({
  opacity: round3(shown),
  transform: [{ translate: [0, round3((1 - shown) * 2.5)] }],
})

const press = (scale: number): Look => ({
  transform: [{ scale: round3(scale) }],
})

export const WANTLIST_SCORE: Score<WantlistTrack> = {
  tracks: WANTLIST_TRACKS,
  length: WANTLIST_LOOP_MS,
  ending: { kind: 'loop', from: 0 },
  // Reduced motion: the offer, the record Owned, the prompt up
  still: 5400,
  cuts: [],
  sample: (ms) => {
    const at = (name: keyof typeof curves) => round3(curves[name](ms))
    // A part's sharp copy and its soft twin
    const focus = (soft: number) => [
      { opacity: round3(sharpness(soft)) },
      { opacity: soft },
    ]
    const [listSharp, listSoft] = focus(at('listSoft'))
    const [screenSharp, screenSoft] = focus(at('screenSoft'))
    const owned = at('owned')
    const count = at('count')
    const shot: Shot<WantlistTrack> = {
      exposure: { opacity: at('exposure') },
      camera: {
        transform: [
          { translate: [at('camX'), 0, at('camZ')] },
          { rotateX: -at('pitch') },
          { rotateY: at('yaw') },
        ],
      },
      wantlist: { opacity: at('listDim') },
      'wantlist:sharp': listSharp,
      'wantlist:soft': listSoft,
      want: {
        opacity: at('wantFade'),
        transform: [
          { perspective: 700 },
          { translate: [0, 0, at('wantLift')] },
          { rotateX: at('wantFold') },
        ],
      },
      others: { opacity: at('othersDim') },
      'count:3': { opacity: round3(1 - count) },
      'count:2': { opacity: count },
      screen: { opacity: at('screenFade') },
      'screen:sharp': screenSharp,
      'screen:soft': screenSoft,
      sheen: { transform: [{ translate: [at('sheen'), 0] }, { rotateZ: 20 }] },
      heading: rise(at('heading')),
      unowned: { opacity: round3(1 - owned) },
      owned: { opacity: owned },
      press: press(at('press')),
      prompt: rise(at('prompt')),
      remove: press(at('remove')),
    }
    return shot
  },
}
