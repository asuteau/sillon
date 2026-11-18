import type * as React from 'react'

import { GeneratedCover } from '#/features/landing/components/GeneratedCover'
import {
  heroTint,
  landingPressing,
  pressingSurface,
} from '#/features/landing/content/landing.content'
import { coverArt } from '#/features/landing/cover-art.utils'
import { seededRandom } from '#/features/collection/disc-surface.utils'
import { Disc } from '#/shared/components/brand/Disc'
import { CollectionIcon } from '#/shared/components/icons/CollectionIcon'

import { FACES, JACKET } from '../storyboard.bake'
import {
  HERO_LANDING_INDEX,
  HERO_TINT_HUE,
  STACK_CAST,
  WALL_CAST,
} from '../storyboard.content'
import type { CastRecord } from '../storyboard.content'
import type { Layout } from '../storyboard.score'

export const abs: React.CSSProperties = { position: 'absolute' }
export const p3d: React.CSSProperties = { transformStyle: 'preserve-3d' }

// Centred on its parent's origin, w × h px
const box = (w: number, h: number): React.CSSProperties => ({
  ...abs,
  left: -w / 2,
  top: -h / 2,
  width: w,
  height: h,
})

const hidden: React.CSSProperties = { backfaceVisibility: 'hidden' }

// The Cover's print wraps round the edges; the bevels show the board
const paintOf = (seed: number) => {
  const light = coverArt(seed, 'light').ground
  const dark = coverArt(seed, 'dark').ground
  return {
    '--edge-light': `color-mix(in oklab, ${light} 74%, black)`,
    '--edge-dark': `color-mix(in oklab, ${dark} 78%, black)`,
    '--bevel-light': `color-mix(in oklab, ${light} 90%, white)`,
    '--bevel-dark': `color-mix(in oklab, ${dark} 88%, white)`,
    '--ground-light': light,
    '--ground-dark': dark,
    '--ink-light': coverArt(seed, 'light').ink,
    '--ink-dark': coverArt(seed, 'dark').ink,
  }
}

const EDGE = 'bg-(--edge-light) dark:bg-(--edge-dark)'

// A Discogs thumbnail: the art, small and without its type
const Thumb = ({ seed }: { seed: number }) => (
  <span className="relative block aspect-square h-full shrink-0 overflow-hidden">
    {(['light', 'dark'] as const).map((theme) => {
      const { ground, shapes } = coverArt(seed, theme)
      return (
        <span
          key={theme}
          className={`absolute inset-0 ${theme === 'light' ? 'dark:hidden' : 'hidden dark:block'}`}
          style={{ background: [...shapes, ground].join(', ') }}
        />
      )
    })}
  </span>
)

// The Challenge: a database row, as Discogs lists a collection
const Row = ({
  record,
  unit,
  layout,
}: {
  record: CastRecord
  unit: number
  layout: Layout
}) => {
  const h = layout.row.height * unit
  const cols = [2.75, 1.35, 0.95, 1.15, 0.45].map((c) => c * unit)
  return (
    <div
      className="flex items-center border-b border-border bg-background text-muted-foreground"
      style={{
        width: '100%',
        height: '100%',
        gap: 0.12 * unit,
        padding: `${h * 0.18}px ${0.1 * unit}px`,
        fontSize: 0.062 * unit,
      }}
    >
      <Thumb seed={record.seed} />
      <span
        className="truncate font-medium text-foreground"
        style={{ width: cols[0] }}
      >
        {record.artist} – {record.title}
      </span>
      <span className="truncate type-catalogue" style={{ width: cols[1] }}>
        {record.label}
      </span>
      <span className="truncate type-catalogue" style={{ width: cols[2] }}>
        {record.catno}
      </span>
      <span className="truncate type-catalogue" style={{ width: cols[3] }}>
        {record.format}
      </span>
      <span className="truncate type-catalogue" style={{ width: cols[4] }}>
        {record.year}
      </span>
    </div>
  )
}

const dof = (name: string) => ({ 'data-part': `${name}-dof` })

// One item of the wall: a row before the wave, a Cover after it. The Cover
// is on the row's back, so the flip turns one into the other
const WallItem = ({
  i,
  unit,
  layout,
}: {
  i: number
  unit: number
  layout: Layout
}) => {
  const record = WALL_CAST[i % WALL_CAST.length]
  const name = `w${i}`
  const d = JACKET.depth * unit
  const edge = (transform: string, w: number, h: number) => (
    <div {...dof(name)} style={{ ...box(w, h), ...hidden, transform }}>
      {/* Hidden while a row: the box behind it would show as slivers */}
      <div
        data-part={`${name}-edge`}
        className={`absolute inset-0 ${EDGE}`}
        style={{ opacity: 0 }}
      />
    </div>
  )
  return (
    <div data-part={name} style={{ ...abs, ...p3d }}>
      <div
        {...dof(name)}
        style={{
          ...box(layout.row.width * unit, layout.row.height * unit),
          ...hidden,
        }}
      >
        <Row record={record} unit={unit} layout={layout} />
      </div>
      <div
        style={{
          ...abs,
          ...p3d,
          ...paintOf(record.seed),
          transform: 'rotateX(180deg)',
        }}
      >
        <div
          {...dof(name)}
          className="overflow-hidden"
          style={{
            ...box(unit, unit),
            ...hidden,
            transform: `translateZ(${d / 2}px)`,
          }}
        >
          <GeneratedCover
            artist={record.artist}
            title={record.title}
            seed={record.seed}
            className="size-full rounded-none"
          />
          <Dim name={name} />
          <Gloss name={`${name}-gloss`} unit={unit} sweep />
        </div>
        {edge(`translate3d(0px, ${-unit / 2}px, 0px) rotateX(90deg)`, unit, d)}
        {edge(`translate3d(0px, ${unit / 2}px, 0px) rotateX(-90deg)`, unit, d)}
        {edge(`translate3d(${-unit / 2}px, 0px, 0px) rotateY(-90deg)`, d, unit)}
        {edge(`translate3d(${unit / 2}px, 0px, 0px) rotateY(90deg)`, d, unit)}
      </div>
    </div>
  )
}

// The key's falloff: away from the hero record the set goes dark
const Dim = ({ name }: { name: string }) => (
  <div
    data-part={`${name}-dim`}
    className="absolute inset-0 bg-background"
    style={{ opacity: 0 }}
  />
)

// The strip softbox's reflection: a hot core in a soft falloff. The
// sweep's is wider and raked, a band of light crossing the wall
const Gloss = ({
  name,
  unit,
  sweep = false,
}: {
  name: string
  unit: number
  sweep?: boolean
}) => (
  <div
    data-part={name}
    style={{
      ...abs,
      top: -unit * 0.25,
      height: unit * 1.5,
      width: unit * 1.1,
      left: unit / 2 - unit * 0.55,
      mixBlendMode: 'plus-lighter',
      opacity: 0,
    }}
  >
    <div
      className="absolute inset-0"
      style={{
        transform: sweep ? 'rotate(16deg) scaleX(1.3)' : undefined,
        background: sweep
          ? 'linear-gradient(90deg, transparent, oklch(1 0 0 / 0.1) 22%, oklch(1 0 0 / 0.42) 46% 54%, oklch(1 0 0 / 0.1) 78%, transparent)'
          : 'linear-gradient(90deg, transparent, oklch(1 0 0 / 0.07) 25%, oklch(1 0 0 / 0.32) 47% 53%, oklch(1 0 0 / 0.07) 75%, transparent)',
      }}
    />
  </div>
)

// A barcode's bars, seeded so each sleeve's differs
const barcode = (seed: number) => {
  const next = seededRandom(seed)
  const stops: string[] = []
  let x = 0
  while (x < 100) {
    const bar = 0.6 + next() * 2.2
    const gap = 0.6 + next() * 1.8
    stops.push(`black ${x.toFixed(1)}% ${(x + bar).toFixed(1)}%`)
    stops.push(
      `transparent ${(x + bar).toFixed(1)}% ${(x + bar + gap).toFixed(1)}%`,
    )
    x += bar + gap
  }
  return `linear-gradient(90deg, ${stops.join(', ')})`
}

// The sleeve's back: credits, the tracklist as lines, the barcode, and
// what the scan draws over it
const SleeveBack = ({
  record,
  name,
  unit,
}: {
  record: CastRecord
  name: string
  unit: number
}) => {
  const lines = (n: number, seed: number) => {
    const next = seededRandom(seed)
    return Array.from({ length: n }, (_, j) => (
      <span
        key={j}
        className="block bg-current opacity-35"
        style={{ height: unit * 0.011, width: `${45 + next() * 50}%` }}
      />
    ))
  }
  return (
    <div
      className="absolute inset-0 flex flex-col bg-(--ground-light) text-(--ink-light) dark:bg-(--ground-dark) dark:text-(--ink-dark)"
      style={{ padding: unit * 0.08, gap: unit * 0.03 }}
    >
      <span className="type-caps" style={{ fontSize: unit * 0.035 }}>
        {record.artist}
      </span>
      <span className="type-title" style={{ fontSize: unit * 0.06 }}>
        {record.title}
      </span>
      <div
        className="grid grid-cols-2"
        style={{ gap: unit * 0.05, marginTop: unit * 0.04 }}
      >
        <div className="flex flex-col" style={{ gap: unit * 0.024 }}>
          {lines(6, record.seed)}
        </div>
        <div className="flex flex-col" style={{ gap: unit * 0.024 }}>
          {lines(5, record.seed + 1)}
        </div>
      </div>
      <span
        className="absolute type-catalogue opacity-70"
        style={{
          left: unit * 0.08,
          bottom: unit * 0.08,
          fontSize: unit * 0.026,
        }}
      >
        {record.label} · {record.catno}
      </span>
      <div
        className="absolute bg-white"
        style={{
          right: unit * 0.08,
          bottom: unit * 0.07,
          width: unit * 0.24,
          height: unit * 0.13,
          padding: unit * 0.014,
        }}
      >
        <div
          className="size-full"
          style={{ background: barcode(record.seed) }}
        />
        <div
          data-part={`${name}-hit`}
          className="absolute inset-0 bg-(--lacquer-1)"
          style={{ opacity: 0, mixBlendMode: 'multiply' }}
        />
        <div
          data-part={`${name}-scan`}
          className="absolute"
          style={{ inset: -unit * 0.025, opacity: 0 }}
        >
          {/* The viewfinder's corners, as the app draws them */}
          {(
            [
              'top-0 left-0 border-t-2 border-l-2',
              'top-0 right-0 border-t-2 border-r-2',
              'bottom-0 left-0 border-b-2 border-l-2',
              'right-0 bottom-0 border-b-2 border-r-2',
            ] as const
          ).map((c) => (
            <span
              key={c}
              className={`absolute border-(--lacquer-2) ${c}`}
              style={{ width: unit * 0.04, height: unit * 0.04 }}
            />
          ))}
          <div
            className="absolute overflow-hidden"
            style={{
              inset: `${unit * 0.02}px ${-unit * 0.06}px`,
              maskImage:
                'linear-gradient(90deg, transparent, black 25% 75%, transparent)',
            }}
          >
            <div
              data-part={`${name}-line`}
              className="absolute inset-x-0 top-0 h-full"
            >
              <span
                className="absolute inset-x-0 top-0 block"
                style={{
                  height: Math.max(2, unit * 0.007),
                  background: 'var(--lacquer-2)',
                  boxShadow: `0 0 ${unit * 0.02}px ${unit * 0.006}px color-mix(in oklab, var(--lacquer-1) 70%, transparent)`,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const MOUTH_WALL = (JACKET.wall / (JACKET.depth - JACKET.bevel)) * 100
const MOUTH_SLOT = `linear-gradient(90deg, var(--edge) 0 ${MOUTH_WALL}%, oklch(0.16 0 0) ${MOUTH_WALL}%, oklch(0.04 0 0) 50%, oklch(0.16 0 0) ${100 - MOUTH_WALL}%, var(--edge) ${100 - MOUTH_WALL}%)`
const MOUTH_LIPS = `linear-gradient(90deg, black 0 ${MOUTH_WALL}%, transparent ${MOUTH_WALL}% ${100 - MOUTH_WALL}%, black ${100 - MOUTH_WALL}%)`

// A Stack sleeve as a solid: the printed front, the back with its barcode,
// the spine, the seams and the mouth, the front's edges bevelled. Each face
// is shaded by the key and blurred by the lens; the edges glint
const StackSleeve = ({ k, unit }: { k: number; unit: number }) => {
  const record = STACK_CAST[k]
  const name = `s${k}`
  const shade = (face: string) => (
    <div
      data-part={`${name}-shade-${face}`}
      className="absolute inset-0 bg-black"
      style={{ opacity: 0.2 }}
    />
  )
  const glintOf = (face: string, mask?: string) => (
    <div
      data-part={`${name}-glint-${face}`}
      className="absolute inset-0"
      style={{
        background: 'oklch(0.97 0.02 80 / 0.5)',
        opacity: 0,
        mixBlendMode: 'plus-lighter',
        maskImage: mask,
      }}
    />
  )
  const d = JACKET.depth * unit
  return (
    <>
      <div
        {...dof(name)}
        className="overflow-hidden"
        style={{
          ...box(unit, unit),
          ...hidden,
          transform: `translateZ(${-d / 2}px) rotateY(180deg)`,
        }}
      >
        <SleeveBack record={record} name={name} unit={unit} />
        {shade('back')}
      </div>
      {FACES.map((face) => {
        const place: React.CSSProperties = {
          ...box(face.width * unit, face.height * unit),
          ...hidden,
          transform: face.transform(unit),
        }
        if (face.key === 'front') {
          return (
            <div
              key={face.key}
              {...dof(name)}
              className="overflow-hidden"
              style={{ ...place, borderRadius: JACKET.bevel * unit }}
            >
              <GeneratedCover
                artist={record.artist}
                title={record.title}
                seed={record.seed}
                className="size-full rounded-none"
              />
              {shade('front')}
              <Gloss name={`${name}-gloss`} unit={unit} />
              <Dim name={name} />
            </div>
          )
        }
        if (face.key === 'mouth') {
          return (
            <div
              key={face.key}
              {...dof(name)}
              className="[--edge:var(--edge-light)] dark:[--edge:var(--edge-dark)]"
              style={{ ...place, background: MOUTH_SLOT }}
            >
              {shade(face.key)}
              {glintOf(face.key, MOUTH_LIPS)}
            </div>
          )
        }
        const bevel = face.key.startsWith('bevel')
        return (
          <div
            key={face.key}
            {...dof(name)}
            className={
              bevel ? 'bg-(--bevel-light) dark:bg-(--bevel-dark)' : EDGE
            }
            style={place}
          >
            {shade(face.key)}
            {glintOf(face.key)}
          </div>
        )
      })}
    </>
  )
}

const HERO_PRESSING = landingPressing(HERO_LANDING_INDEX)
const HERO_SURFACE = pressingSurface(HERO_PRESSING)
const DISC_DIAMETER = 0.94

// The hero's disc with thickness: two plain layers under the grooved face.
// The sheen is the light's, not the record's: it sits outside the turn
const DiscBody = ({ unit }: { unit: number }) => {
  const size = DISC_DIAMETER * unit
  const depth = Math.max(2, 0.008 * unit)
  const layer = (z: number) => (
    <div
      data-part="disc-dof"
      className="rounded-full"
      style={{
        ...box(size, size),
        transform: `translateZ(${z}px)`,
        background: `color-mix(in oklab, ${HERO_SURFACE.background} 70%, black)`,
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
          '--cover-tint': heroTint(HERO_TINT_HUE),
        }}
      >
        <div
          data-part="disc-spin"
          className="absolute inset-0 [&_.disc]:inset-0 [&_.disc]:shadow-none [&_.disc-sheen]:hidden"
        >
          <Disc
            surface={HERO_SURFACE.background}
            seeThrough={HERO_SURFACE.seeThrough}
          />
        </div>
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

const softShadow = (unit: number, blur = 0.05): React.CSSProperties => ({
  background: 'var(--pull-shadow)',
  filter: `blur(${unit * blur}px)`,
  opacity: 0,
})

// The world: the wall (rows, then Covers) with its shadows, the floor with
// the loose sleeves' shadows, the Stack and the hero's disc
export const StoryboardSet = ({
  unit,
  layout,
}: {
  unit: number
  layout: Layout
}) => (
  <>
    {/* The wall's plane: shadows of what stands off it */}
    <div style={{ ...abs, ...p3d }}>
      {Array.from({ length: layout.count }, (_, i) => (
        <div
          key={i}
          data-part={`w${i}-shadow`}
          style={{ ...box(unit * 0.98, unit * 0.98), ...softShadow(unit) }}
        />
      ))}
      {STACK_CAST.map((_, k) => (
        <div
          key={k}
          data-part={`s${k}-wallshadow`}
          style={{
            ...box(unit * 0.98, unit * 0.98),
            ...softShadow(unit, 0.07),
          }}
        />
      ))}
    </div>
    {/* The floor */}
    <div
      style={{
        ...abs,
        ...p3d,
        transform: `translate3d(0px, ${-layout.floorY * unit}px, 0px) rotateX(90deg)`,
      }}
    >
      {/* The surface the sleeves were dropped on: a pool of light on the
          page ground, no edge */}
      <div
        style={{
          ...box(unit * 9, unit * 5),
          transform: `translate(${layout.loose[1].x * unit}px, ${(layout.loose[1].z + 0.6) * unit}px)`,
          background:
            'radial-gradient(closest-side, color-mix(in oklab, var(--foreground) 7%, transparent), transparent)',
        }}
      />
      {STACK_CAST.map((_, k) => (
        <div key={k} data-part={`s${k}-shadow`} style={abs}>
          <div
            style={{
              ...box(unit * 1.02, unit * 1.02),
              ...softShadow(unit, 0.035),
              opacity: 1,
            }}
          />
        </div>
      ))}
    </div>
    {Array.from({ length: layout.count }, (_, i) => (
      <WallItem key={i} i={i} unit={unit} layout={layout} />
    ))}
    {STACK_CAST.map((record, k) => (
      <div
        key={k}
        data-part={`s${k}`}
        style={{ ...abs, ...p3d, ...paintOf(record.seed) }}
      >
        {k === STACK_CAST.length - 1 && (
          <div data-part="disc-move" style={{ ...abs, ...p3d }}>
            <DiscBody unit={unit} />
          </div>
        )}
        <StackSleeve k={k} unit={unit} />
      </div>
    ))}
  </>
)

// The Stack's bar, as the app pins it under the Stack: the count, then the
// one confirm
export const StackHud = ({ centre }: { centre: number }) => (
  <div
    data-part="hud"
    className="pointer-events-none absolute bottom-[7%] flex w-0 justify-center"
    style={{ opacity: 0, left: `${centre * 100}%` }}
  >
    <div className="flex shrink-0 items-center gap-4 rounded-full border border-border bg-card/90 py-1.5 pr-1.5 pl-5 shadow-lg backdrop-blur">
      <span className="flex items-baseline gap-2">
        <span className="type-caps text-xs text-muted-foreground">Stack</span>
        <span className="relative inline-block h-[1.2em] w-[1ch] overflow-hidden type-catalogue text-base text-foreground">
          {[1, 2, 3].map((n) => (
            <span
              key={n}
              data-part={`hud-n${n}`}
              className="absolute inset-0"
              style={{ opacity: 0 }}
            >
              {n}
            </span>
          ))}
        </span>
      </span>
      <span className="relative flex h-9 items-center">
        <span
          data-part="hud-hint"
          className="absolute right-0 pr-4 text-sm whitespace-nowrap text-muted-foreground"
        >
          Point at barcode
        </span>
        <span
          data-part="hud-btn"
          className="relative flex h-9 items-center gap-2 overflow-hidden rounded-full bg-primary px-4 text-sm font-medium whitespace-nowrap text-primary-foreground"
          style={{ opacity: 0 }}
        >
          <CollectionIcon className="size-4" />
          Add 3 to Collection
          <span
            data-part="hud-press"
            className="absolute inset-0 bg-background/25"
            style={{ opacity: 0 }}
          />
        </span>
      </span>
    </div>
  </div>
)
