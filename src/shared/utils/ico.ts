// Packs PNG images into a .ico file (PNG-compressed entries, Vista+)

interface IcoImage {
  /** Square size in px */
  size: number
  png: Uint8Array
}

const HEADER_BYTES = 6
const ENTRY_BYTES = 16
const TYPE_ICON = 1
const COLOUR_PLANES = 1
const BITS_PER_PIXEL = 32

export const encodeIco = (images: IcoImage[]): Uint8Array => {
  const dataStart = HEADER_BYTES + ENTRY_BYTES * images.length
  const total = images.reduce((sum, { png }) => sum + png.length, dataStart)
  const ico = new Uint8Array(total)
  const view = new DataView(ico.buffer)

  // ICONDIR: reserved, type, count
  view.setUint16(0, 0, true)
  view.setUint16(2, TYPE_ICON, true)
  view.setUint16(4, images.length, true)

  let offset = dataStart
  images.forEach(({ size, png }, i) => {
    // ICONDIRENTRY: width, height (0 means 256), palette, reserved, planes,
    // bpp, data length, data offset
    const entry = HEADER_BYTES + ENTRY_BYTES * i
    const side = size >= 256 ? 0 : size
    view.setUint8(entry, side)
    view.setUint8(entry + 1, side)
    view.setUint16(entry + 4, COLOUR_PLANES, true)
    view.setUint16(entry + 6, BITS_PER_PIXEL, true)
    view.setUint32(entry + 8, png.length, true)
    view.setUint32(entry + 12, offset, true)
    ico.set(png, offset)
    offset += png.length
  })

  return ico
}
