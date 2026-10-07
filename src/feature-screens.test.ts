import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

// #13: feature screens use only Sillon tokens and classes
const SRC = join(import.meta.dirname)
const componentFiles = (path: string) =>
  readdirSync(join(SRC, path))
    .filter((f) => f.endsWith('.tsx') && !f.endsWith('.test.tsx'))
    .map((f) => join(path, f))

const FILES = [
  ...componentFiles('features/collection/components'),
  ...componentFiles('features/search/components'),
  ...componentFiles('features/wantlist/components'),
  ...componentFiles('features/marketplace/components'),
  'features/profile/components/MetricsStrip.tsx',
  'shared/components/ReleaseSheet.tsx',
  'shared/components/SearchReleaseSheet.tsx',
  'shared/components/SheetCover.tsx',
  'shared/components/BarcodeScanner.tsx',
  ...componentFiles('routes/_authenticated'),
  'routes/index.tsx',
]

const LEGACY_TEMPLATE_PATTERNS = [
  // tokens
  /--(sea-ink|lagoon|palm|sand|foam|surface|line|inset-glint|kicker|bg-base|header-bg|chip-bg|chip-line|link-bg-hover|hero-[ab])\b/,
  // classes
  /\b(island-[a-z]+|display-title|page-wrap|feature-card|rise-in|nav-link|site-footer)\b/,
  // in-between radii and template colours
  /\brounded-(md|lg|xl|2xl|3xl|4xl)\b/,
  /rgba\(/,
]

describe('feature screens', () => {
  it.each(FILES)('%s uses only the new tokens and classes', (file) => {
    const source = readFileSync(join(SRC, file), 'utf8')
    for (const pattern of LEGACY_TEMPLATE_PATTERNS)
      expect(source).not.toMatch(pattern)
  })
})
