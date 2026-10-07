import { formatOklch, oklabToOklch, rgbToOklab } from '#/shared/utils/colour'
import type { Oklch } from '#/shared/utils/colour'

// Every tint shares one lightness and a low chroma ceiling: the cover sets
// the hue, never how loud it is. The CSS --cover-glow relights it per theme.
export const TINT_LIGHTNESS = 0.62
export const TINT_MAX_CHROMA = 0.09

// Below this chroma a pixel counts as grey
const GREY_CHROMA = 0.04
// Near-black and near-white (borders, paper) say little about a cover
const MIN_LIGHTNESS = 0.12
const MAX_LIGHTNESS = 0.96
// The winning hue must cover at least this share of the sampled pixels
const MIN_SHARE = 0.1
const HUE_BINS = 12

const SAMPLE_SIZE = 32

interface HueBin {
  count: number
  weight: number
  a: number
  b: number
}

// One dominant, muted colour from RGBA pixels; grey when the cover has no
// clear colour, null when nothing could be sampled
export const dominantTint = (rgba: ArrayLike<number>): Oklch | null => {
  const bins: HueBin[] = Array.from({ length: HUE_BINS }, () => ({
    count: 0,
    weight: 0,
    a: 0,
    b: 0,
  }))
  let sampled = 0

  for (let i = 0; i + 3 < rgba.length; i += 4) {
    if (rgba[i + 3] < 128) continue
    const lab = rgbToOklab([
      rgba[i] / 255,
      rgba[i + 1] / 255,
      rgba[i + 2] / 255,
    ])
    if (lab.l < MIN_LIGHTNESS || lab.l > MAX_LIGHTNESS) continue
    sampled++

    const { c, h } = oklabToOklch(lab)
    if (c < GREY_CHROMA) continue
    // Chroma-weighted, so a vivid area beats a dull one of the same size
    const bin = bins[Math.floor(h / (360 / HUE_BINS)) % HUE_BINS]
    bin.count++
    bin.weight += c
    bin.a += lab.a * c
    bin.b += lab.b * c
  }

  if (sampled === 0) return null

  const best = bins.reduce((top, bin) => (bin.weight > top.weight ? bin : top))
  if (best.count < sampled * MIN_SHARE) return { l: TINT_LIGHTNESS, c: 0, h: 0 }

  const { c, h } = oklabToOklch({
    l: TINT_LIGHTNESS,
    a: best.a / best.weight,
    b: best.b / best.weight,
  })
  return { l: TINT_LIGHTNESS, c: Math.min(c, TINT_MAX_CHROMA), h }
}

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })

// Samples a Cover image into a CSS colour. The image must be served with CORS
// (Deezer is, Discogs isn't). Null when the image can't be read, e.g. a tainted canvas.
export const sampleCoverTint = async (src: string): Promise<string | null> => {
  try {
    const img = await loadImage(src)
    const canvas = document.createElement('canvas')
    canvas.width = SAMPLE_SIZE
    canvas.height = SAMPLE_SIZE
    const context = canvas.getContext('2d', { willReadFrequently: true })
    if (!context) return null
    context.drawImage(img, 0, 0, SAMPLE_SIZE, SAMPLE_SIZE)
    const { data } = context.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE)
    const tint = dominantTint(data)
    return tint ? formatOklch(tint) : null
  } catch {
    return null
  }
}
