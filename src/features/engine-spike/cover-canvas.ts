// The generated Cover art painted on a canvas, for a WebGL texture. A port
// of coverArt(): same seed, same random draws in the same order, same
// shapes, drawn with Canvas 2D instead of CSS gradients. Spike only; if WebGL
// ships, coverArt should return shapes as data and both draw from them.
import { seededRandom } from '#/features/collection/disc-surface.utils'
import type { CoverTheme } from '#/features/landing/cover-art.utils'

type Random = () => number
type Paint = (ctx: CanvasRenderingContext2D, size: number) => void

const round = (n: number) => Math.round(n * 10) / 10

const oklch = (l: number, c: number, h: number) =>
  `oklch(${round(l * 100) / 100} ${round(c * 1000) / 1000} ${Math.round(h)})`

// The same colour, see-through: canvas gradients fade to it without the
// dark fringe 'transparent' (black at 0) gives
const clear = (colour: string) => colour.replace(')', ' / 0)')

// radial-gradient(circle at x% y%, c r1%, transparent r2%): % of the
// distance to the farthest corner; a second stop before the first is a hard
// edge. Random draws are read eagerly, in coverArt()'s order
const circle = (colour: string, next: Random): Paint => {
  const [x, y] = [round(15 + next() * 70) / 100, round(15 + next() * 70) / 100]
  const [r1, r2] = [
    round(14 + next() * 22) / 100,
    round(14.4 + next() * 22) / 100,
  ]
  return (ctx, size) =>
    paintCircle(ctx, size, colour, x, y, r1, Math.max(r1, r2))
}

const paintCircle = (
  ctx: CanvasRenderingContext2D,
  size: number,
  colour: string,
  x: number,
  y: number,
  r1: number,
  r2: number,
) => {
  const far = Math.hypot(Math.max(x, 1 - x), Math.max(y, 1 - y)) * size
  const g = ctx.createRadialGradient(
    x * size,
    y * size,
    0,
    x * size,
    y * size,
    far,
  )
  g.addColorStop(0, colour)
  g.addColorStop(Math.min(1, r1), colour)
  g.addColorStop(Math.min(1, r2 + 0.002), clear(colour))
  ctx.fillStyle = g
  ctx.fillRect(0, 0, size, size)
}

const band = (colour: string, next: Random): Paint => {
  const [from, to] = [
    round(10 + next() * 40) / 100,
    round(52 + next() * 30) / 100,
  ]
  const vertical = next() < 0.5
  return (ctx, size) => {
    ctx.fillStyle = colour
    // 0deg runs bottom to top; 90deg left to right
    if (vertical) ctx.fillRect(0, size * (1 - to), size, size * (to - from))
    else ctx.fillRect(size * from, 0, size * (to - from), size)
  }
}

const stripes = (colour: string, next: Random): Paint => {
  const angle = Math.round(next() * 180)
  const [ink, period] = [
    round(1 + next() * 2) / 100,
    round(7 + next() * 6) / 100,
  ]
  return (ctx, size) => {
    const a = (angle * Math.PI) / 180
    const length = size * (Math.abs(Math.sin(a)) + Math.abs(Math.cos(a)))
    ctx.save()
    ctx.translate(size / 2, size / 2)
    // CSS: 0deg points up, clockwise; stripes run across that direction
    ctx.rotate(a)
    ctx.fillStyle = colour
    for (let d = 0; d < 1; d += period) {
      ctx.fillRect(
        -length,
        length / 2 - (d + ink) * length,
        length * 2,
        ink * length,
      )
    }
    ctx.restore()
  }
}

const sunburst = (colour: string, next: Random): Paint => {
  const from = Math.round(next() * 90)
  const [x, y] = [round(20 + next() * 60) / 100, round(20 + next() * 60) / 100]
  const [ink, period] = [round(2 + next() * 3), round(12 + next() * 8)]
  return (ctx, size) => {
    const [cx, cy, r] = [x * size, y * size, size * 2]
    ctx.fillStyle = colour
    for (let d = 0; d < 360; d += period) {
      // CSS conic angles start up and turn clockwise; canvas starts right
      const a0 = ((from + d - 90) * Math.PI) / 180
      const a1 = ((from + d + ink - 90) * Math.PI) / 180
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.arc(cx, cy, r, a0, a1)
      ctx.closePath()
      ctx.fill()
    }
  }
}

const SHAPES = [circle, band, stripes, sunburst]

const wrap = (
  ctx: CanvasRenderingContext2D,
  text: string,
  width: number,
  maxLines: number,
) => {
  const words = text.split(' ')
  const lines: string[] = []
  let line = ''
  for (const word of words) {
    const tryLine = line ? `${line} ${word}` : word
    if (ctx.measureText(tryLine).width > width && line) {
      lines.push(line)
      line = word
    } else line = tryLine
  }
  if (line) lines.push(line)
  return lines.slice(0, maxLines)
}

export const paintCover = (
  canvas: HTMLCanvasElement,
  {
    seed,
    theme,
    artist,
    title,
  }: { seed: number; theme: CoverTheme; artist: string; title: string },
) => {
  const size = canvas.width
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const next = seededRandom(seed)
  // paletteOf()
  const hue = next() * 360
  const partnerHue = (hue + 40 + next() * 140) % 360
  const dark = theme === 'dark'
  const accent = oklch(dark ? 0.72 : 0.55, 0.14 + next() * 0.06, hue)
  const partner = oklch(dark ? 0.58 : 0.74, 0.1 + next() * 0.06, partnerHue)
  const pick = () => SHAPES[Math.floor(next() * SHAPES.length)]
  const [first, second] = [pick(), pick()]
  // Top first, as CSS layers: second, first, circle, over the ground
  const top = second(partner, next)
  const middle = first(accent, next)
  const bottom = circle(accent, next)
  ctx.fillStyle = oklch(dark ? 0.2 : 0.94, 0.03, hue)
  ctx.fillRect(0, 0, size, size)
  for (const paint of [bottom, middle, top]) paint(ctx, size)

  // The type, as GeneratedCover sets it
  const ink = oklch(dark ? 0.95 : 0.2, 0.02, hue)
  const inset = size * 0.08
  const family =
    getComputedStyle(document.documentElement)
      .getPropertyValue('--font-sans')
      .replace(/\s+/g, ' ')
      .trim() || 'sans-serif'
  ctx.fillStyle = ink
  ctx.textBaseline = 'alphabetic'
  const titleSize = size * 0.12
  ctx.font = `700 ${titleSize}px ${family}`
  ctx.letterSpacing = `${-0.045 * titleSize}px`
  const lines = wrap(ctx, title, size - inset * 2, 3)
  const lead = titleSize * 0.95
  let y = size - inset - (lines.length - 1) * lead - titleSize * 0.18
  const titleTop = y - titleSize * 0.8
  for (const line of lines) {
    ctx.fillText(line, inset, y)
    y += lead
  }
  const artistSize = size * 0.06
  ctx.font = `500 ${artistSize}px ${family}`
  ctx.letterSpacing = `${0.12 * artistSize}px`
  ctx.fillText(artist.toUpperCase(), inset, titleTop - size * 0.03)
}
