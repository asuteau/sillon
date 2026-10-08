// Covers decoded ahead of time (see preloadCover): shown at once, no fade
const decoded = new Set<string>()

export const isCoverDecoded = (src: string) => decoded.has(src)

// Loads and decodes a Cover before it's shown. False when it can't be loaded,
// so the record falls back to its House sleeve.
export const preloadCover = async (src: string): Promise<boolean> => {
  if (decoded.has(src)) return true
  const img = new Image()
  img.crossOrigin = 'anonymous'
  img.src = src
  try {
    await img.decode()
    decoded.add(src)
    return true
  } catch {
    return false
  }
}
