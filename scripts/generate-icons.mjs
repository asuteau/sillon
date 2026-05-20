// Generates PWA placeholder icons using only Node.js built-in modules.
// Run once: node scripts/generate-icons.mjs
import { deflateSync } from 'node:zlib'
import { writeFileSync, mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const outDir = resolve(__dirname, '../public/icons')
mkdirSync(outDir, { recursive: true })

const BG = [0x0a, 0x0a, 0x0b]
const FG = [0x8b, 0x7f, 0xe8]

// 9×13 pixel bitmap for "S" (1 = foreground, 0 = background)
const S_BITMAP = [
  [0, 1, 1, 1, 1, 1, 1, 1, 0],
  [1, 1, 0, 0, 0, 0, 0, 1, 1],
  [1, 1, 0, 0, 0, 0, 0, 0, 0],
  [1, 1, 0, 0, 0, 0, 0, 0, 0],
  [0, 1, 1, 1, 1, 1, 1, 0, 0],
  [0, 0, 1, 1, 1, 1, 1, 1, 0],
  [0, 0, 0, 0, 0, 0, 1, 1, 1],
  [0, 0, 0, 0, 0, 0, 0, 1, 1],
  [0, 0, 0, 0, 0, 0, 0, 1, 1],
  [1, 1, 0, 0, 0, 0, 0, 1, 1],
  [1, 1, 0, 0, 0, 0, 0, 1, 1],
  [0, 1, 1, 1, 1, 1, 1, 1, 0],
  [0, 0, 1, 1, 1, 1, 1, 0, 0],
]

const crc32Table = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c
  }
  return t
})()

const crc32 = (buf) => {
  let crc = 0xffffffff
  for (const b of buf) crc = crc32Table[(crc ^ b) & 0xff] ^ (crc >>> 8)
  return (crc ^ 0xffffffff) >>> 0
}

const u32be = (n) => {
  const b = Buffer.alloc(4)
  b.writeUInt32BE(n)
  return b
}

const chunk = (type, data) => {
  const typeBytes = Buffer.from(type, 'ascii')
  const crc = crc32(Buffer.concat([typeBytes, data]))
  return Buffer.concat([u32be(data.length), typeBytes, data, u32be(crc)])
}

const makePng = (width, height, pixels) => {
  // pixels: Uint8Array of length width*height*3 (RGB)
  const ihdr = Buffer.concat([
    u32be(width),
    u32be(height),
    Buffer.from([8, 2, 0, 0, 0]), // 8-bit RGB, no interlace
  ])

  // Build raw scanlines: filter byte (0) + RGB row
  const raw = Buffer.alloc(height * (1 + width * 3))
  for (let y = 0; y < height; y++) {
    raw[y * (1 + width * 3)] = 0 // filter type None
    for (let x = 0; x < width; x++) {
      const src = (y * width + x) * 3
      const dst = y * (1 + width * 3) + 1 + x * 3
      raw[dst] = pixels[src]
      raw[dst + 1] = pixels[src + 1]
      raw[dst + 2] = pixels[src + 2]
    }
  }

  const compressed = deflateSync(raw, { level: 9 })

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), // PNG signature
    chunk('IHDR', ihdr),
    chunk('IDAT', compressed),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

const renderIcon = (size, padding = 0) => {
  const pixels = new Uint8Array(size * size * 3)

  // Fill background
  for (let i = 0; i < size * size; i++) {
    pixels[i * 3] = BG[0]
    pixels[i * 3 + 1] = BG[1]
    pixels[i * 3 + 2] = BG[2]
  }

  const innerSize = size - padding * 2
  const bitmapH = S_BITMAP.length
  const bitmapW = S_BITMAP[0].length

  // Scale "S" to ~40% of inner area
  const scale = Math.floor((innerSize * 0.4) / Math.max(bitmapW, bitmapH))
  if (scale < 1) return pixels

  const glyphW = bitmapW * scale
  const glyphH = bitmapH * scale
  const offX = padding + Math.floor((innerSize - glyphW) / 2)
  const offY = padding + Math.floor((innerSize - glyphH) / 2)

  for (let by = 0; by < bitmapH; by++) {
    for (let bx = 0; bx < bitmapW; bx++) {
      if (!S_BITMAP[by][bx]) continue
      const color = FG
      for (let dy = 0; dy < scale; dy++) {
        for (let dx = 0; dx < scale; dx++) {
          const px = offX + bx * scale + dx
          const py = offY + by * scale + dy
          if (px < 0 || py < 0 || px >= size || py >= size) continue
          const i = (py * size + px) * 3
          pixels[i] = color[0]
          pixels[i + 1] = color[1]
          pixels[i + 2] = color[2]
        }
      }
    }
  }

  return pixels
}

const icons = [
  { name: 'icon-192.png', size: 192, padding: 0 },
  { name: 'icon-512.png', size: 512, padding: 0 },
  { name: 'icon-512-maskable.png', size: 512, padding: Math.floor(512 * 0.2) },
]

for (const { name, size, padding } of icons) {
  const pixels = renderIcon(size, padding)
  const png = makePng(size, size, pixels)
  const outPath = resolve(outDir, name)
  writeFileSync(outPath, png)
  console.log(`✓ ${outPath} (${size}×${size}, padding=${padding}px)`)
}
