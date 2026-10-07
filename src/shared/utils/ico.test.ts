import { describe, expect, it } from 'vitest'

import { encodeIco } from './ico'

describe('encodeIco', () => {
  it('packs PNGs into an ICO directory', () => {
    const ico = encodeIco([
      { size: 16, png: new Uint8Array([1, 2, 3]) },
      { size: 32, png: new Uint8Array([4, 5, 6, 7]) },
    ])
    const view = new DataView(ico.buffer)

    // ICONDIR: reserved, type 1 (icon), count
    expect(view.getUint16(0, true)).toBe(0)
    expect(view.getUint16(2, true)).toBe(1)
    expect(view.getUint16(4, true)).toBe(2)

    // First ICONDIRENTRY
    expect(ico[6]).toBe(16)
    expect(ico[7]).toBe(16)
    expect(view.getUint16(10, true)).toBe(1) // planes
    expect(view.getUint16(12, true)).toBe(32) // bpp
    expect(view.getUint32(14, true)).toBe(3)
    const firstOffset = view.getUint32(18, true)
    expect(firstOffset).toBe(6 + 2 * 16)
    expect([...ico.slice(firstOffset, firstOffset + 3)]).toEqual([1, 2, 3])

    const secondOffset = view.getUint32(16 + 18, true)
    expect(secondOffset).toBe(firstOffset + 3)
    expect([...ico.slice(secondOffset)]).toEqual([4, 5, 6, 7])
  })

  it('writes 0 for 256px entries', () => {
    const ico = encodeIco([{ size: 256, png: new Uint8Array([0]) }])
    expect(ico[6]).toBe(0)
  })
})
