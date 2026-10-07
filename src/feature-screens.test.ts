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
  ...componentFiles('features/landing/components'),
  'features/profile/components/MetricsStrip.tsx',
  'shared/components/ReleaseSheet.tsx',
  'shared/components/SearchReleaseSheet.tsx',
  'shared/components/SheetCover.tsx',
  'shared/components/BarcodeScanner.tsx',
  ...componentFiles('routes/_authenticated'),
  'routes/index.tsx',
]

const TEMPLATE_TOKEN_PATTERN =
  /--(sea-ink|lagoon|palm|sand|foam|surface|line|inset-glint|kicker|bg-base|header-bg|chip-bg|chip-line|link-bg-hover|hero-[ab])\b/

const LEGACY_TEMPLATE_PATTERNS = [
  TEMPLATE_TOKEN_PATTERN,
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

// #16: the landing hero is sized to its content
describe('landing page', () => {
  it.each(componentFiles('features/landing/components'))(
    '%s never fills the viewport height',
    (file) => {
      expect(readFileSync(join(SRC, file), 'utf8')).not.toMatch(
        /\b(h-screen|min-h-screen|[hy]-(s|d|l)?vh|min-h-(s|d|l)vh)\b|100(s|d|l)?vh/,
      )
    },
  )
})

// #14: the template token aliases are gone, so nothing may reference them
describe('template token aliases', () => {
  const sourceFiles = (path: string): string[] =>
    readdirSync(join(SRC, path), { withFileTypes: true }).flatMap((entry) => {
      const file = join(path, entry.name)
      if (entry.isDirectory()) return sourceFiles(file)
      return /\.(tsx?|css)$/.test(entry.name) && !/\.test\./.test(entry.name)
        ? [file]
        : []
    })

  it.each(sourceFiles('.'))('%s does not use them', (file) => {
    expect(readFileSync(join(SRC, file), 'utf8')).not.toMatch(
      TEMPLATE_TOKEN_PATTERN,
    )
  })
})
