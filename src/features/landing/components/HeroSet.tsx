import { memo } from 'react'
import type * as React from 'react'

import { seededRandom } from '#/features/collection/disc-surface.utils'
import { Disc } from '#/shared/components/brand/Disc'
import { SLEEVE_COMPOSITIONS } from '#/shared/utils/house-sleeve'

import { GeneratedCover } from './GeneratedCover'
import { HERO_RECORD, STACK_CAST, WALL_CAST } from '../content/hero.content'
import type { CastRecord } from '../content/hero.content'
import { coverArt } from '../cover-art.utils'
import { lookStyle } from '../film/film-css.utils'
import type { Shot } from '../film/film.model'
import { JACKET } from '../film/jacket.utils'
import type { JacketFaceKey } from '../film/jacket.utils'
import type { Layout } from '../hero/hero-cues.score'
import { BARCODE, HERO_FACES } from '../hero/hero.score'
import type { HeroTrack } from '../hero/hero.score'

export type HeroLooks = Shot<HeroTrack>

const cqw = (n: number) => `${Math.round(n * 1000) / 1000}cqw`

// Centred on its parent's origin, w × h stage units
const box = (w: number, h: number): React.CSSProperties => ({
  position: 'absolute',
  left: cqw(-w / 2),
  top: cqw(-h / 2),
  width: cqw(w),
  height: cqw(h),
})

interface TrackedProps {
  name: HeroTrack
  looks: HeroLooks
  className?: string
  style?: React.CSSProperties
  children?: React.ReactNode
}

// One element the film moves (`data-track`, see useFilmPlayer), resting at
// its look until the browser takes over
export const Tracked = ({
  name,
  looks,
  className,
  style,
  children,
}: TrackedProps) => (
  <div
    data-track={name}
    className={className}
    style={{ ...style, ...lookStyle(looks[name] ?? {}) }}
  >
    {children}
  </div>
)

// The Cover's print wraps round the edges; the bevels show the board
const paintOf = (seed: number) => {
  const light = coverArt(seed, 'light').ground
  const dark = coverArt(seed, 'dark').ground
  return {
    '--edge-light': `color-mix(in oklab, ${light} 74%, black)`,
    '--edge-dark': `color-mix(in oklab, ${dark} 78%, black)`,
    '--bevel-light': `color-mix(in oklab, ${light} 90%, white)`,
    '--bevel-dark': `color-mix(in oklab, ${dark} 88%, white)`,
  }
}

const EDGE = 'bg-(--edge-light) dark:bg-(--edge-dark)'
const P3D = 'absolute transform-3d'
const HIDDEN = 'backface-hidden'

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

const ROW_COLUMNS = [2.75, 1.35, 0.95, 1.15, 0.45]

interface RowProps {
  record: CastRecord
  unit: number
  layout: Layout
}

// The Challenge: a database row, as Discogs lists a collection
const Row = ({ record, unit, layout }: RowProps) => {
  const h = layout.row.height * unit
  const [main, ...rest] = ROW_COLUMNS.map((c) => cqw(c * unit))
  const cells = [record.label, record.catno, record.format, record.year]
  return (
    <div
      className="flex size-full items-center border-b border-border bg-background text-muted-foreground"
      style={{
        gap: cqw(0.12 * unit),
        padding: `${cqw(h * 0.18)} ${cqw(0.1 * unit)}`,
        fontSize: cqw(0.062 * unit),
      }}
    >
      <Thumb seed={record.seed} />
      <span
        className="truncate font-medium text-foreground"
        style={{ width: main }}
      >
        {record.artist} – {record.title}
      </span>
      {cells.map((cell, c) => (
        <span
          key={c}
          className="truncate type-catalogue"
          style={{ width: rest[c] }}
        >
          {cell}
        </span>
      ))}
    </div>
  )
}

interface GlossProps {
  name: HeroTrack
  looks: HeroLooks
  unit: number
  sweep?: boolean
}

// The strip softbox's reflection: a hot core in a soft falloff. The sweep's
// is wider and raked, a band of light crossing the wall; stronger on the
// light theme's paler Covers
const Gloss = ({ name, looks, unit, sweep = false }: GlossProps) => (
  <Tracked
    name={name}
    looks={looks}
    className={
      sweep
        ? 'absolute mix-blend-plus-lighter [--core:0.62] [--falloff:0.16] dark:[--core:0.42] dark:[--falloff:0.1]'
        : 'absolute mix-blend-plus-lighter'
    }
    style={{
      top: cqw(-unit * 0.25),
      height: cqw(unit * 1.5),
      width: cqw(unit * 1.1),
      left: cqw(unit / 2 - unit * 0.55),
    }}
  >
    <div
      className="absolute inset-0"
      style={{
        transform: sweep ? 'rotate(16deg) scaleX(1.3)' : undefined,
        background: sweep
          ? 'linear-gradient(90deg, transparent, oklch(1 0.01 80 / var(--falloff)) 22%, oklch(1 0.01 80 / var(--core)) 46% 54%, oklch(1 0.01 80 / var(--falloff)) 78%, transparent)'
          : 'linear-gradient(90deg, transparent, oklch(1 0 0 / 0.07) 25%, oklch(1 0 0 / 0.32) 47% 53%, oklch(1 0 0 / 0.07) 75%, transparent)',
      }}
    />
  </Tracked>
)

interface WallItemProps {
  i: number
  unit: number
  soft: number
  layout: Layout
  looks: HeroLooks
}

// A face's soft twin: the same print under a static blur, faded in by the
// lens over the sharp face, just in front of it
const softTwin = (soft: number, transform: string): React.CSSProperties => ({
  filter: `blur(${cqw(soft)})`,
  transform: `${transform} translateZ(0.01cqw)`,
})

// One item of the wall: a row before the wave, a Cover after it. The Cover
// is on the row's back, so the flip turns one into the other
const WallItem = ({ i, unit, soft, layout, looks }: WallItemProps) => {
  const record = WALL_CAST[i % WALL_CAST.length]
  const d = JACKET.depth * unit
  const edges = [
    [`translate3d(0, ${cqw(-unit / 2)}, 0) rotateX(90deg)`, unit, d],
    [`translate3d(0, ${cqw(unit / 2)}, 0) rotateX(-90deg)`, unit, d],
    [`translate3d(${cqw(-unit / 2)}, 0, 0) rotateY(-90deg)`, d, unit],
    [`translate3d(${cqw(unit / 2)}, 0, 0) rotateY(90deg)`, d, unit],
  ] as const
  return (
    <Tracked name={`w${i}`} looks={looks} className={P3D}>
      <div
        className={HIDDEN}
        style={box(layout.row.width * unit, layout.row.height * unit)}
      >
        <Row record={record} unit={unit} layout={layout} />
      </div>
      <div
        className={P3D}
        style={{ ...paintOf(record.seed), transform: 'rotateX(180deg)' }}
      >
        <Tracked
          name={`w${i}-face`}
          looks={looks}
          className={`overflow-hidden ${HIDDEN}`}
          style={{ ...box(unit, unit), transform: `translateZ(${cqw(d / 2)})` }}
        >
          <GeneratedCover
            artist={record.artist}
            title={record.title}
            seed={record.seed}
            className="size-full rounded-none"
          />
          {/* Unlit until the sweep passes: darker, not paler, in light */}
          <Tracked
            name={`w${i}-shade`}
            looks={looks}
            className="absolute inset-0 bg-[oklch(0.24_0.01_60)] dark:bg-background"
          />
          <Gloss name={`w${i}-gloss`} looks={looks} unit={unit} sweep />
        </Tracked>
        <Tracked
          name={`w${i}-soft`}
          looks={looks}
          className={HIDDEN}
          style={{
            ...box(unit, unit),
            ...softTwin(soft, `translateZ(${cqw(d / 2)})`),
          }}
        >
          <GeneratedCover
            artist={record.artist}
            title={record.title}
            seed={record.seed}
            className="size-full rounded-none"
          />
        </Tracked>
        {/* Hidden while a row: the box behind it would show as slivers */}
        {edges.map(([transform, w, h]) => (
          <Tracked
            key={transform}
            name={`w${i}-edge`}
            looks={looks}
            className={`${EDGE} ${HIDDEN}`}
            style={{ ...box(w, h), transform }}
          />
        ))}
      </div>
    </Tracked>
  )
}

// A barcode's bars, seeded so each sleeve's differs
const barcode = (seed: number) => {
  const next = seededRandom(seed)
  const stops: string[] = []
  let x = 0
  while (x < 100) {
    const bar = 0.6 + next() * 2.2
    const gap = 0.6 + next() * 1.8
    stops.push(`currentColor ${x.toFixed(1)}% ${(x + bar).toFixed(1)}%`)
    stops.push(
      `transparent ${(x + bar).toFixed(1)}% ${(x + bar + gap).toFixed(1)}%`,
    )
    x += bar + gap
  }
  return `linear-gradient(90deg, ${stops.join(', ')})`
}

// Printed paper, whichever the theme, a touch dimmer on dark so it doesn't
// glare
const [PAPER] = SLEEVE_COMPOSITIONS
const FINDER_CORNERS = [
  'top-0 left-0 border-t-2 border-l-2',
  'top-0 right-0 border-t-2 border-r-2',
  'bottom-0 left-0 border-b-2 border-l-2',
  'right-0 bottom-0 border-r-2 border-b-2',
] as const

interface SleeveBackProps {
  record: CastRecord
  k: number
  unit: number
  // Without them, the back alone: the soft twin, nothing scanning on it
  looks?: HeroLooks
}

// The sleeve's back, the side a scan reads: credits, the running order as
// lines, the barcode, and what the scan draws over it
const SleeveBack = ({ record, k, unit, looks }: SleeveBackProps) => {
  const lines = (n: number, seed: number) => {
    const next = seededRandom(seed)
    return Array.from({ length: n }, (_, j) => (
      <span
        key={j}
        className="block bg-current opacity-35"
        style={{ height: cqw(unit * 0.011), width: `${45 + next() * 50}%` }}
      />
    ))
  }
  return (
    <div
      className="absolute inset-0 flex flex-col bg-(--paper) text-(--paper-ink) [--paper-ink:#0d0d0e] dark:bg-[color-mix(in_oklab,var(--paper)_84%,black)]"
      style={{
        padding: cqw(unit * 0.08),
        gap: cqw(unit * 0.03),
        '--paper': PAPER.ground,
      }}
    >
      <span className="type-caps" style={{ fontSize: cqw(unit * 0.035) }}>
        {record.artist}
      </span>
      <span className="type-title" style={{ fontSize: cqw(unit * 0.06) }}>
        {record.title}
      </span>
      <div
        className="grid grid-cols-2"
        style={{ gap: cqw(unit * 0.05), marginTop: cqw(unit * 0.04) }}
      >
        <div className="flex flex-col" style={{ gap: cqw(unit * 0.024) }}>
          {lines(6, record.seed)}
        </div>
        <div className="flex flex-col" style={{ gap: cqw(unit * 0.024) }}>
          {lines(5, record.seed + 1)}
        </div>
      </div>
      <span
        className="absolute type-catalogue opacity-70"
        style={{
          left: cqw(unit * 0.08),
          bottom: cqw(unit * 0.08),
          fontSize: cqw(unit * 0.026),
        }}
      >
        {record.label} · {record.catno}
      </span>
      <div
        className="absolute bg-white"
        style={{
          right: cqw(unit * BARCODE.right),
          bottom: cqw(unit * BARCODE.bottom),
          width: cqw(unit * BARCODE.width),
          height: cqw(unit * BARCODE.height),
          padding: cqw(unit * 0.016),
        }}
      >
        <div
          className="size-full"
          style={{ background: barcode(record.seed) }}
        />
        {looks && (
          <>
            <Tracked
              name={`s${k}-hit`}
              looks={looks}
              className="absolute inset-0 bg-(--lacquer-1) mix-blend-multiply"
            />
            <Tracked
              name={`s${k}-scan`}
              looks={looks}
              className="absolute"
              style={{ inset: cqw(-unit * 0.025) }}
            >
              {/* The viewfinder's corners, as the app draws them; vinyl black
              on the paper, whichever the theme */}
              {FINDER_CORNERS.map((c) => (
                <span
                  key={c}
                  className={`absolute border-vinyl-black ${c}`}
                  style={{ width: cqw(unit * 0.04), height: cqw(unit * 0.04) }}
                />
              ))}
              <div
                className="absolute overflow-hidden"
                style={{
                  inset: `${cqw(unit * 0.025)} ${cqw(-unit * 0.06)}`,
                  maskImage:
                    'linear-gradient(90deg, transparent, black 25% 75%, transparent)',
                }}
              >
                <Tracked
                  name={`s${k}-line`}
                  looks={looks}
                  className="absolute inset-x-0 top-0"
                >
                  <span
                    className="absolute inset-x-0 top-0 block bg-(--lacquer-2)"
                    style={{
                      height: `max(2px, ${cqw(unit * 0.007)})`,
                      boxShadow: `0 0 ${cqw(unit * 0.02)} ${cqw(unit * 0.006)} color-mix(in oklab, var(--lacquer-1) 70%, transparent)`,
                    }}
                  />
                </Tracked>
              </div>
            </Tracked>
          </>
        )}
      </div>
    </div>
  )
}

const MOUTH_WALL = (JACKET.wall / (JACKET.depth - JACKET.bevel)) * 100
const MOUTH_SLOT = `linear-gradient(90deg, var(--edge) 0 ${MOUTH_WALL}%, oklch(0.16 0 0) ${MOUTH_WALL}%, oklch(0.04 0 0) 50%, oklch(0.16 0 0) ${100 - MOUTH_WALL}%, var(--edge) ${100 - MOUTH_WALL}%)`
const MOUTH_LIPS = `linear-gradient(90deg, black 0 ${MOUTH_WALL}%, transparent ${MOUTH_WALL}% ${100 - MOUTH_WALL}%, black ${100 - MOUTH_WALL}%)`

interface StackSleeveProps {
  k: number
  unit: number
  soft: number
  looks: HeroLooks
}

// A Stack sleeve as a solid: the printed front, the back with its barcode,
// the spine, the seams and the mouth, the front's edges bevelled. Each face
// is shaded by the key, the edges glint; only the front and back have a
// soft twin
const StackSleeve = ({ k, unit, soft, looks }: StackSleeveProps) => {
  const record = STACK_CAST[k]
  const shade = (face: JacketFaceKey | 'back') => (
    <Tracked
      name={`s${k}-shade-${face}`}
      looks={looks}
      className="absolute inset-0 bg-black"
    />
  )
  const glintOf = (face: JacketFaceKey, mask?: string) => (
    <Tracked
      name={`s${k}-glint-${face}`}
      looks={looks}
      className="absolute inset-0 bg-[oklch(0.97_0.02_80/0.5)] mix-blend-plus-lighter"
      style={{ maskImage: mask }}
    />
  )
  const d = JACKET.depth * unit
  return (
    <>
      <div
        className={`overflow-hidden ${HIDDEN}`}
        style={{
          ...box(unit, unit),
          transform: `translateZ(${cqw(-d / 2)}) rotateY(180deg)`,
        }}
      >
        <SleeveBack record={record} k={k} unit={unit} looks={looks} />
        {shade('back')}
      </div>
      <Tracked
        name={`s${k}-soft`}
        looks={looks}
        className={`overflow-hidden ${HIDDEN}`}
        style={{
          ...box(unit, unit),
          ...softTwin(soft, `translateZ(${cqw(-d / 2)}) rotateY(180deg)`),
        }}
      >
        <SleeveBack record={record} k={k} unit={unit} />
      </Tracked>
      <Tracked
        name={`s${k}-soft`}
        looks={looks}
        className={HIDDEN}
        style={{
          ...box(unit, unit),
          ...softTwin(soft, `translateZ(${cqw(d / 2)})`),
        }}
      >
        <GeneratedCover
          artist={record.artist}
          title={record.title}
          seed={record.seed}
          className="size-full rounded-none"
        />
      </Tracked>
      {HERO_FACES.map((face) => {
        const placed: React.CSSProperties = {
          ...box(face.width * unit, face.height * unit),
          transform: face.transform(unit),
        }
        if (face.key === 'front') {
          return (
            <div
              key={face.key}
              className={`overflow-hidden ${HIDDEN}`}
              style={{ ...placed, borderRadius: cqw(JACKET.bevel * unit) }}
            >
              <GeneratedCover
                artist={record.artist}
                title={record.title}
                seed={record.seed}
                className="size-full rounded-none"
              />
              {shade('front')}
              <Gloss name={`s${k}-gloss`} looks={looks} unit={unit} />
              <Gloss name={`s${k}-landed`} looks={looks} unit={unit} sweep />
              <Tracked
                name={`s${k}-dim`}
                looks={looks}
                className="absolute inset-0 bg-background"
              />
            </div>
          )
        }
        if (face.key === 'mouth') {
          return (
            <Tracked
              key={face.key}
              name={`s${k}-edge`}
              looks={looks}
              className={`[--edge:var(--edge-light)] dark:[--edge:var(--edge-dark)] ${HIDDEN}`}
              style={{ ...placed, background: MOUTH_SLOT }}
            >
              {shade(face.key)}
              {glintOf(face.key, MOUTH_LIPS)}
            </Tracked>
          )
        }
        const bevel = face.key.startsWith('bevel')
        return (
          <Tracked
            key={face.key}
            name={`s${k}-edge`}
            looks={looks}
            className={`${bevel ? 'bg-(--bevel-light) dark:bg-(--bevel-dark)' : EDGE} ${HIDDEN}`}
            style={placed}
          >
            {shade(face.key)}
            {glintOf(face.key)}
          </Tracked>
        )
      })}
    </>
  )
}

const DISC_DIAMETER = 0.94

// The hero's disc with thickness: two plain layers under the grooved face.
// The sheen is the light's, not the record's: it sits outside the turn.
// Only the face blurs
const DiscBody = ({ unit, looks }: { unit: number; looks: HeroLooks }) => {
  const size = DISC_DIAMETER * unit
  const depth = 0.008 * unit
  const { surface, tint } = HERO_RECORD
  const layer = (z: number) => (
    <div
      className="rounded-full"
      style={{
        ...box(size, size),
        transform: `translateZ(${cqw(z)})`,
        background: `color-mix(in oklab, ${surface.background} 70%, black)`,
      }}
    />
  )
  return (
    <>
      {layer(-depth / 2)}
      {layer(0)}
      <div
        className="rounded-full"
        style={{
          ...box(size, size),
          transform: `translateZ(${cqw(depth / 2)})`,
          '--cover-tint': tint,
        }}
      >
        <Tracked
          name="spin"
          looks={looks}
          className="absolute inset-0 [&_.disc]:inset-0 [&_.disc]:shadow-none [&_.disc-sheen]:hidden"
        >
          <Disc surface={surface.background} seeThrough={surface.seeThrough} />
        </Tracked>
        <Tracked
          name="disc-sheen"
          looks={looks}
          className="absolute inset-0 rounded-full mix-blend-multiply"
          style={{
            background:
              'conic-gradient(transparent 20deg, oklch(0 0 0 / 0.32) 90deg, transparent 160deg 200deg, oklch(0 0 0 / 0.32) 270deg, transparent 340deg)',
          }}
        />
        <Tracked
          name="disc-sheen"
          looks={looks}
          className="absolute inset-0 rounded-full mix-blend-plus-lighter"
          style={{
            maskImage: 'radial-gradient(circle, transparent 34%, black 37%)',
          }}
        >
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background:
                'conic-gradient(oklch(1 0 0 / 0.7), oklch(1 0 0 / 0.22) 10deg, transparent 32deg 148deg, oklch(1 0 0 / 0.22) 170deg, oklch(1 0 0 / 0.7) 180deg, oklch(1 0 0 / 0.22) 190deg, transparent 212deg 328deg, oklch(1 0 0 / 0.22) 350deg)',
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
        </Tracked>
      </div>
    </>
  )
}

// A soft shadow: static blur, only its opacity and place move
const SHADOW = 'bg-(--pull-shadow)'
const softBlur = (unit: number, blur: number) => ({
  filter: `blur(${cqw(unit * blur)})`,
})

interface HeroSetProps {
  unit: number
  // The soft twins' blur
  soft: number
  layout: Layout
  looks: HeroLooks
}

// The world: the wall (rows, then Covers) with its shadows, the floor with
// the loose sleeves' shadows, the Stack and the hero's disc
export const HeroSet = memo(({ unit, soft, layout, looks }: HeroSetProps) => (
  <>
    {/* The wall's plane: shadows of what stands off it */}
    <div className={P3D}>
      {Array.from({ length: layout.count }, (_, i) => (
        <Tracked
          key={i}
          name={`w${i}-shadow`}
          looks={looks}
          className={SHADOW}
          style={{ ...box(unit * 0.98, unit * 0.98), ...softBlur(unit, 0.05) }}
        />
      ))}
      {STACK_CAST.map((_, k) => (
        <Tracked
          key={k}
          name={`s${k}-wallshadow`}
          looks={looks}
          className={SHADOW}
          style={{ ...box(unit * 0.98, unit * 0.98), ...softBlur(unit, 0.07) }}
        />
      ))}
    </div>
    {/* The floor */}
    <div
      className={P3D}
      style={{
        transform: `translate3d(0, ${cqw(-layout.floorY * unit)}, 0) rotateX(90deg)`,
      }}
    >
      {/* The surface the sleeves were dropped on: a pool of light on the
          page ground, no edge */}
      <div
        style={{
          ...box(unit * 9, unit * 5),
          transform: `translate(${cqw(layout.loose[1].x * unit)}, ${cqw((layout.loose[1].z + 0.6) * unit)})`,
          background:
            'radial-gradient(closest-side, color-mix(in oklab, var(--foreground) 7%, transparent), transparent)',
        }}
      />
      {STACK_CAST.map((_, k) => (
        <Tracked
          key={k}
          name={`s${k}-shadow`}
          looks={looks}
          className="absolute"
        >
          <div
            className={SHADOW}
            style={{
              ...box(unit * 1.02, unit * 1.02),
              ...softBlur(unit, 0.035),
            }}
          />
        </Tracked>
      ))}
    </div>
    {Array.from({ length: layout.count }, (_, i) => (
      <WallItem
        key={i}
        i={i}
        unit={unit}
        soft={soft}
        layout={layout}
        looks={looks}
      />
    ))}
    {STACK_CAST.map((record, k) => (
      <Tracked
        key={k}
        name={`s${k}`}
        looks={looks}
        className={P3D}
        style={paintOf(record.seed)}
      >
        {k === STACK_CAST.length - 1 && (
          <Tracked name="disc" looks={looks} className={P3D}>
            <DiscBody unit={unit} looks={looks} />
          </Tracked>
        )}
        <StackSleeve k={k} unit={unit} soft={soft} looks={looks} />
      </Tracked>
    ))}
  </>
))
HeroSet.displayName = 'HeroSet'
