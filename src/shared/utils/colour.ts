// sRGB channels in 0–1
export type Rgb = [number, number, number]

export interface Oklab {
  l: number
  a: number
  b: number
}

export interface Oklch {
  l: number
  c: number
  // Degrees, 0–360
  h: number
}

const toLinear = (c: number) =>
  c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4

const fromLinear = (c: number) =>
  c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055

const clamp01 = (c: number) => Math.min(1, Math.max(0, c))

export const hexToRgb = (hex: string): Rgb => {
  const value = Number.parseInt(hex.replace('#', ''), 16)
  return [
    ((value >> 16) & 255) / 255,
    ((value >> 8) & 255) / 255,
    (value & 255) / 255,
  ]
}

// Björn Ottosson's OKLab, https://bottosson.github.io/posts/oklab/
export const rgbToOklab = ([r, g, b]: Rgb): Oklab => {
  const lr = toLinear(r)
  const lg = toLinear(g)
  const lb = toLinear(b)
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb)
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb)
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb)
  return {
    l: 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    a: 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    b: 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  }
}

export const oklabToOklch = ({ l, a, b }: Oklab): Oklch => ({
  l,
  c: Math.hypot(a, b),
  h: ((Math.atan2(b, a) * 180) / Math.PI + 360) % 360,
})

// Out-of-gamut channels are clipped
export const oklchToRgb = ({ l, c, h }: Oklch): Rgb => {
  const a = c * Math.cos((h * Math.PI) / 180)
  const b = c * Math.sin((h * Math.PI) / 180)
  const lc = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const mc = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const sc = (l - 0.0894841775 * a - 1.291485548 * b) ** 3
  const toChannel = (linear: number) => clamp01(fromLinear(linear))
  return [
    toChannel(4.0767416621 * lc - 3.3077115913 * mc + 0.2309699292 * sc),
    toChannel(-1.2684380046 * lc + 2.6097574011 * mc - 0.3413193965 * sc),
    toChannel(-0.0041960863 * lc - 0.7034186147 * mc + 1.707614701 * sc),
  ]
}

// Alpha-composites `top` over `bottom`, as the browser does in sRGB
export const blend = (bottom: Rgb, top: Rgb, alpha: number): Rgb => {
  const mix = (b: number, t: number) => b * (1 - alpha) + t * alpha
  return [
    mix(bottom[0], top[0]),
    mix(bottom[1], top[1]),
    mix(bottom[2], top[2]),
  ]
}

export const formatOklch = ({ l, c, h }: Oklch): string =>
  `oklch(${l} ${c.toFixed(3)} ${h.toFixed(1)})`

// WCAG 2 relative luminance and contrast ratio
const luminance = ([r, g, b]: Rgb) =>
  0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b)

export const contrastRatio = (x: Rgb, y: Rgb): number => {
  const [hi, lo] = [luminance(x), luminance(y)].sort((p, q) => q - p)
  return (hi + 0.05) / (lo + 0.05)
}
