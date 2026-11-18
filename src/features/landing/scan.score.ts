// The landing's Scan loop as a score (film/film.model.ts): one sleeve at a
// time, pulled from a shop crate, turned to its barcode, scanned, matched on
// Discogs, and sent to a list. Two passes, then round again: the first
// sleeve goes to the Collection, the second to the Wantlist.
//
// Each pass: the camera pushes in as a hand lifts the front sleeve out of
// the crate and turns it over; the viewfinder locks on its barcode, the scan
// line crosses it, the flash; the focus pulls to the Stack panel rising with
// the match; the second pass switches it to the Wantlist; added, the sleeve
// leaves, the line the app says once it's added rises, and the camera eases
// back to the crate, now one sleeve lighter at the front. The sleeve put
// back fades in behind while the camera's focus is on the panel.
import { CURVES, track } from './film/film.model'
import type { Curve, Key, Look, Move, Score, Shot } from './film/film.model'

// One pass: one sleeve scanned and sent
export const SCAN_PASS_MS = 6400

// The film's own: a camera with weight, slow off the mark, a long settle
const DOLLY: Curve = [0.55, 0, 0.12, 1]

// Lens distance for the sleeves (CSS px), each about its own centre: the
// sleeves share one box, so they share one vanishing point
const LENS = 900

export const SCAN_TRACKS = [
  // The camera on the crate: push in, pull focus
  'set',
  // The two sleeves standing in the crate, Cover forward
  'crate:a',
  'crate:b',
  // The same sleeves lifted out, in hand
  'held:a',
  'held:b',
  // Each held sleeve's Cover side, shown while it faces the lens, and its
  // back, shown once turned past a quarter. Not left to
  // backface-visibility: the sleeve's fade flattens its 3D
  'front:a',
  'front:b',
  'back:a',
  'back:b',
  // Light catching each sleeve's back as it turns
  'sheen:a',
  'sheen:b',
  // The viewfinder's corners, its scan line and flash
  'finder',
  'scanline',
  'flash',
  // The Stack of one each pass shows, and its list
  'panel:a',
  'panel:b',
  'bar:collection',
  'bar:wantlist',
  // "1 record added to your …"
  'sent:a',
  'sent:b',
] as const

export type ScanTrack = (typeof SCAN_TRACKS)[number]

type Face = 'front:a' | 'front:b' | 'back:a' | 'back:b'
type CuedTrack = Exclude<ScanTrack, Face>

// Translate (stage units; z toward the viewer), turns and scale, opacity and
// lens blur
interface Pose {
  x: number
  y: number
  z: number
  rx: number
  ry: number
  rz: number
  s: number
  opacity: number
  blur: number
}

const REST: Pose = {
  x: 0,
  y: 0,
  z: 0,
  rx: 0,
  ry: 0,
  rz: 0,
  s: 1,
  opacity: 1,
  blur: 0,
}

// At `at` ms, this pose; `ease` curves the step to the next cue
type Cue = readonly [at: number, pose: Partial<Pose>, ease?: Curve]

const shift = (cues: readonly Cue[], by: number): Cue[] =>
  cues.map(([at, pose, ease]) => [at + by, pose, ease])

// A pass's cues, played in both passes
const bothPasses = (cues: readonly Cue[]): Cue[] => [
  ...cues,
  ...shift(cues, SCAN_PASS_MS),
]

// Pass-local beats (ms)
const LIFT = 200
const HELD_AT = 1400
const LOCKED = 1800
const SWEEP: readonly [number, number] = [1900, 2350]
const FLASH = 2400
const MATCH = 2600
const MATCHED = 3300
// The second pass only: "To Wantlist instead"
const SWITCH = 3700
const SEND = 4700
const SENT = 5400
const BACK = 6400

// The crate, seen from the front: sleeves leaning back, the front one first
const CRATE_A: Partial<Pose> = { y: 31, rx: 62 }
const CRATE_B: Partial<Pose> = { x: 3, y: 28, z: -9, rx: 62, rz: 1.5 }
// The rest of the crate, never lifted: further back, smaller in the lens
export const CRATE_REST: readonly Partial<Pose>[] = [
  { x: -2, y: 25, z: -18, rx: 62, rz: -1 },
  { x: 2, y: 22, z: -27, rx: 62, rz: 1 },
]

// In hand, turned to its back: a touch toward the lens, tilted
const HELD: Partial<Pose> = { y: -2, z: 8, rx: 6, ry: 180, rz: -3 }
const SWAYED: Partial<Pose> = { ...HELD, y: -1, rz: -1.5 }
// Behind the panel, the focus pulled off it
const RECEDED: Partial<Pose> = { y: -12, z: -24, rx: 10, ry: 180, rz: -1.5 }
// Away, up and out: sent to its list
const GONE: Partial<Pose> = {
  y: -70,
  z: -60,
  rx: 20,
  ry: 180,
  rz: 6,
  s: 0.8,
  opacity: 0,
}

// A sleeve in hand through its own pass, from `start`: shown in its crate
// pose the instant its crate sleeve hides, lifted and turned, held, behind
// the panel, then sent; back in the crate, hidden, for the other pass
const held = (start: number, crate: Partial<Pose>): Cue[] => [
  [0, { ...crate, opacity: 0 }],
  [start + LIFT - 1, { ...crate, opacity: 0 }],
  [start + LIFT, crate, CURVES.platter],
  [start + HELD_AT, HELD, CURVES.inOut],
  [start + MATCH, SWAYED, CURVES.platter],
  [start + MATCHED, RECEDED],
  [start + SEND, RECEDED, CURVES.inOut],
  [start + SEND + 600, GONE],
  [start + SEND + 601, { ...crate, opacity: 0 }],
]

// The crate sleeve: hidden as it's lifted; another one put back in its
// place during the other pass, while the focus is on the panel
const crate = (start: number, other: number, pose: Partial<Pose>): Cue[] => {
  const cues: Cue[] = [
    [start + LIFT - 1, { ...pose, opacity: 1 }],
    [start + LIFT, { ...pose, opacity: 0 }],
    [other + MATCH + 300, { ...pose, opacity: 0 }, CURVES.fade],
    [other + MATCH + 1100, { ...pose, opacity: 1 }],
  ]
  return cues.sort(([a], [b]) => a - b)
}

const sheen = (start: number): Cue[] => [
  [0, { opacity: 0 }],
  [start + 700, { opacity: 0 }],
  [start + 950, { opacity: 0.45 }, CURVES.fade],
  [start + 1600, { opacity: 0.1 }],
  [start + MATCHED, { opacity: 0 }],
]

const PANEL_OFF: Partial<Pose> = { y: 16, opacity: 0 }

const panel = (start: number): Cue[] => [
  [0, PANEL_OFF],
  [start + MATCH + 100, PANEL_OFF, CURVES.out],
  [start + MATCHED, {}],
  [start + SEND, {}, CURVES.fade],
  [start + SEND + 300, { y: -3, opacity: 0 }],
  [start + SEND + 301, PANEL_OFF],
]

const SENT_OFF: Partial<Pose> = { y: 3, opacity: 0 }

const sent = (start: number): Cue[] => [
  [0, SENT_OFF],
  [start + SEND + 300, SENT_OFF, CURVES.out],
  [start + SENT, {}],
  [start + BACK - 500, {}, CURVES.fade],
  [start + BACK - 100, { opacity: 0 }],
  [start + BACK - 99, SENT_OFF],
]

const FINDER_OFF: Partial<Pose> = { s: 1.25, opacity: 0 }
const LINE_FROM: Partial<Pose> = { x: -12, opacity: 0 }

const B = SCAN_PASS_MS
// The panel's bar leaves the second pass at its end, ready for the next
const BAR_RESET = B + SEND + 302

const CUES: Record<CuedTrack, readonly Cue[]> = {
  set: bothPasses([
    [0, {}],
    [LIFT, {}, DOLLY],
    [HELD_AT + 100, { s: 1.16 }, CURVES.out],
    [HELD_AT + 700, { s: 1.13 }],
    [MATCH, { s: 1.13 }, CURVES.platter],
    [MATCH + 600, { y: -4, s: 1.05, blur: 0.5 }],
    [SENT, { y: -4, s: 1.05, blur: 0.5 }, CURVES.platter],
    [BACK, {}],
  ]),
  'crate:a': crate(0, B, CRATE_A),
  'crate:b': crate(B, 0, CRATE_B),
  'held:a': held(0, CRATE_A),
  'held:b': held(B, CRATE_B),
  'sheen:a': sheen(0),
  'sheen:b': sheen(B),
  finder: bothPasses([
    [0, FINDER_OFF],
    [HELD_AT, FINDER_OFF, CURVES.out],
    [LOCKED, {}],
    [MATCH, {}, CURVES.fade],
    [MATCH + 300, { opacity: 0 }],
    [MATCH + 301, FINDER_OFF],
  ]),
  scanline: bothPasses([
    [0, LINE_FROM],
    [LOCKED, LINE_FROM, CURVES.fade],
    [SWEEP[0], { x: -12 }, CURVES.inOut],
    [SWEEP[1], { x: 12 }, CURVES.fade],
    [SWEEP[1] + 100, { x: 12, opacity: 0 }],
    [SWEEP[1] + 101, LINE_FROM],
  ]),
  flash: bothPasses([
    [0, { opacity: 0 }],
    [FLASH - 1, { opacity: 0 }],
    [FLASH, {}, CURVES.fade],
    [FLASH + 320, { opacity: 0 }],
  ]),
  'panel:a': panel(0),
  'panel:b': panel(B),
  'bar:collection': [
    [0, {}],
    [B + SWITCH, {}, CURVES.fade],
    [B + SWITCH + 160, { opacity: 0 }],
    [BAR_RESET - 1, { opacity: 0 }],
    [BAR_RESET, {}],
  ],
  'bar:wantlist': [
    [0, { opacity: 0 }],
    [B + SWITCH + 40, { opacity: 0 }, CURVES.fade],
    [B + SWITCH + 200, {}],
    [BAR_RESET - 1, {}],
    [BAR_RESET, { opacity: 0 }],
  ],
  'sent:a': sent(0),
  'sent:b': sent(B),
}

const FIELDS = [
  'x',
  'y',
  'z',
  'rx',
  'ry',
  'rz',
  's',
  'opacity',
  'blur',
] as const satisfies readonly (keyof Pose)[]

// Each field of a track over time, every cue a full pose
const compile = (cues: readonly Cue[]) => {
  const fields = FIELDS.map((field) => {
    const keys: Key[] = cues.map(([at, pose, ease]) => [
      at,
      { ...REST, ...pose }[field],
      ease,
    ])
    return [field, track(keys)] as const
  })
  return (ms: number): Pose => {
    const pose = { ...REST }
    for (const [field, value] of fields)
      pose[field] = Math.round(value(ms) * 1000) / 1000
    return pose
  }
}

const CUED = SCAN_TRACKS.filter(
  (name): name is CuedTrack =>
    !name.startsWith('front:') && !name.startsWith('back:'),
)
const POSES = new Map(CUED.map((name) => [name, compile(CUES[name])]))

const FACES: readonly (readonly [Face, Face, CuedTrack])[] = [
  ['front:a', 'back:a', 'held:a'],
  ['front:b', 'back:b', 'held:b'],
]

// Facing the lens: turned less than a quarter either way
const facesLens = (ry: number) => Math.cos((ry * Math.PI) / 180) > 0

// A sleeve in the crate's 3D: through the lens, about its own centre
export const sleeveMoves = ({ x, y, z, rx, ry, rz, s }: Pose): Move[] => [
  { perspective: LENS },
  { translate: [x, y, z] },
  { rotateX: rx },
  { rotateY: ry },
  { rotateZ: rz },
  { scale: s },
]

const flatMoves = ({ x, y, s }: Pose): Move[] => [
  { translate: [x, y] },
  { scale: s },
]

const SLEEVES: readonly ScanTrack[] = ['crate:a', 'crate:b', 'held:a', 'held:b']
const FADES: readonly ScanTrack[] = [
  'sheen:a',
  'sheen:b',
  'flash',
  'bar:collection',
  'bar:wantlist',
]

const lookOf = (name: ScanTrack, pose: Pose): Look => {
  if (name === 'set') return { transform: flatMoves(pose), blur: pose.blur }
  if (SLEEVES.includes(name))
    return { opacity: pose.opacity, transform: sleeveMoves(pose) }
  if (FADES.includes(name)) return { opacity: pose.opacity }
  return { opacity: pose.opacity, transform: flatMoves(pose) }
}

// The crate's back sleeves, never moved: their look, for React to set once
export const crateRestLook = (index: number): Look => ({
  transform: sleeveMoves({ ...REST, ...CRATE_REST[index] }),
})

export const SCAN_SCORE: Score<ScanTrack> = {
  tracks: SCAN_TRACKS,
  length: 2 * SCAN_PASS_MS,
  ending: { kind: 'loop', from: 0 },
  // Reduced motion: the first sleeve matched, its Stack ready to add to the
  // Collection, the sleeve behind it out of focus
  still: 4200,
  cuts: [
    ...new Set(
      Object.values(CUES).flatMap((cues) =>
        cues.map(([at]) => at).filter((at) => at > 0 && at < 2 * B),
      ),
    ),
  ].sort((a, b) => a - b),
  sample: (ms) => {
    const shot: Shot<ScanTrack> = {}
    for (const [name, pose] of POSES) shot[name] = lookOf(name, pose(ms))
    for (const [front, back, inHand] of FACES) {
      const facing = facesLens(POSES.get(inHand)?.(ms).ry ?? 0)
      shot[front] = { opacity: facing ? 1 : 0 }
      shot[back] = { opacity: facing ? 0 : 1 }
    }
    return shot
  },
}
