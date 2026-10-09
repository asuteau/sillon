# Sillon — Design System

What shipped, and why. The source of truth is the code; this doc points at it.

- Tokens, type roles, motion CSS: `src/styles.css`
- Brand components: `src/shared/components/brand/` (mark, wordmark, loader)
- Icons: `src/shared/components/icons/`
- shadcn primitives: `src/shared/components/ui/`
- Specimens the decisions were made from (open in a browser): `docs/brand/specimens/`

---

## 1. Concept

**The groove.** _Sillon_ is French for the groove in a record. The visual signature is a single continuous spiral line: the mark, the loader, the Home icon and the launch screen are all that one line.

Typography is editorial and modernist, in the record-sleeve tradition (Blue Note, ECM): black, white and grey, hierarchy from weight and case, colour only where a record brings it.

---

## 2. Fonts

Two variable fonts, self-hosted as `.woff2` in `public/fonts/` (OFL, licences alongside), declared with `@font-face` in `src/styles.css`, split into latin and latin-ext by `unicode-range`.

No Google Fonts request: the PWA works offline and no third party sees who opens the app.

| Token            | Font                                    | Role                                                  |
| ---------------- | --------------------------------------- | ----------------------------------------------------- |
| `--font-sans`    | Familjen Grotesk (400–700)              | Display and UI                                        |
| `--font-display` | `var(--font-sans)`                      | Display role only — swap here to bring in a paid face |
| `--font-mono`    | Martian Mono (100–800, `wdth` 75–112.5) | Catalogue data: cat no., year, format, counts         |

### Type roles

Tailwind utilities in `src/styles.css`. They set family, weight, tracking and leading, never size: callers pick the size.

| Utility          | Setting                                       | Used for                       |
| ---------------- | --------------------------------------------- | ------------------------------ |
| `type-display`   | display, 700, tracking −0.045em, leading 0.95 | Page and sheet titles          |
| `type-title`     | display, 700, tracking −0.02em, leading 1.2   | Record titles in lists         |
| `type-caps`      | 500, uppercase, tracking 0.08em               | Artist names, section labels   |
| `type-catalogue` | mono, `font-stretch: 87.5%`, tabular numbers  | Catalogue lines, about 10–12px |

Leading goes through `--tw-leading` so a `text-*` size utility doesn't reset it.

**No italics.** Hierarchy comes from weight, case and tracking only. Familjen's italic is not shipped, and a sleeve-style system reads cleaner without a second voice; one less font file too.

---

## 3. Colour and tokens

The interface is black, white and grey with a slight warm bias. Theme follows the OS (`prefers-color-scheme`); the theme toggle stores `light` / `dark` / `auto` in `localStorage` and sets `.light` or `.dark` on `<html>` (an inline script in `__root.tsx` does it before paint). Light and dark get equal care; the signature is strongest in dark.

### Copper is a material, not an accent

Records are the colour. A fixed accent would fight every cover on screen, and a stock brand-hue accent is what makes an app look like every other SaaS template. So:

- Colour on record screens comes from the current Cover (`--cover-tint`).
- **Copper lacquer** is the one brand material, from the copper master a record is pressed from.
- It's used only on brand moments, never for hover, selection, focus, links or any general interactive state.
- It has two renderings of the same three stops: **sweep** for marks (icon, favicon, launch screen, the groove mark in lacquer tone — the landing's closing mark above "Bring your crates." — House sleeve shapes) and **satin** for buttons.
- **No text on the sweep.** Text on lacquer always goes on a satin button.

### Token contract

The contract is **shadcn's variables**, defined for light (`:root`) and dark (`.dark`, and `@media (prefers-color-scheme: dark) { :root:not(.light) }` — keep the two dark blocks in sync). Components use the Tailwind colours they map to (`bg-background`, `text-muted-foreground`, `border-border`…), never raw values.

| Variable                          | Light                 | Dark                  | Notes                                             |
| --------------------------------- | --------------------- | --------------------- | ------------------------------------------------- |
| `--background`                    | `#f5f5f3`             | `#0e0e0d`             | Mirrored by the `theme-color` metas               |
| `--foreground`                    | `#141413`             | `#ebeae7`             |                                                   |
| `--card` / `--popover`            | `#fbfbfa`             | `#151514` / `#181817` |                                                   |
| `--primary`                       | `#141413`             | `#ebeae7`             | The text colour: solid black / solid white button |
| `--secondary` / `--accent`        | `#e9e8e5`             | `#222220`             | Neutral fills, not a hue accent                   |
| `--muted` / `--muted-foreground`  | `#ebeae7` / `#6b6b69` | `#1d1d1c` / `#8b8a87` |                                                   |
| `--border` / `--input` / `--ring` | greys                 | greys                 | Focus outline itself uses `--foreground`          |
| `--destructive`                   | oklch red             | oklch red             | The one hue in the UI chrome, for errors only     |
| `--radius`                        | `2px`                 |                       | See the shape rule                                |

### Sillon additions

| Variable                                        | What                                                                                                                                 |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `--lacquer`                                     | Sweep: copper master gradient, `120deg` over `--lacquer-1..3` (`#f2d3bf`, `#b06d4a` at 60%, `#e6b394`). Marks only, never text.      |
| `--lacquer-satin` / `--lacquer-satin-hover`     | Satin: `180deg` from `--lacquer-1` to `--lacquer-3`, lit from above, no dark band. Hover moves the bottom ~20% toward `--lacquer-2`. |
| `--lacquer-satin-shadow`                        | Satin's box-shadow: white top highlight (60%), 1px bottom line and `0 4px 14px` shadow at 35% of `--lacquer-2`.                      |
| `--lacquer-foreground`                          | `#0d0d0e`, the label on satin. It never sits on stop 2: ≈ 13.7:1 on stop 1, 10.4:1 on stop 3, ≈ 9:1 on the hover end.                |
| `--vinyl-black`                                 | `#0a0a0b` — the brand ground (icon, launch screen, vinyl house sleeve).                                                              |
| `--cover-tint`                                  | Set at runtime from the current Cover; neutral `oklch(0.62 0 0)` until then.                                                         |
| `--cover-glow-lightness` / `--cover-glow-alpha` | Per-theme relighting of the tint for the glow, so text over it stays AA.                                                             |

**Copper lacquer is for brand moments only**: app icon, launch screen, and the lacquer buttons (Random pick, Pick again, Scan, the landing CTA) — plus the shapes on House sleeves, its one non-interactive use. Never for hover, selection, focus or any general interactive state — that's what `--primary` and the neutrals are for. Buttons use `<Button variant="lacquer">` (satin); marks use `bg-(image:--lacquer)` (sweep). Satin and sweep are the same in light and dark: lacquer is a material, not a theme colour, so the dark blocks don't redefine it. Satin is derived from the stop tokens, so changing the stops updates both. SVG can't use a CSS gradient: `GrooveMark` builds a `<linearGradient>` from `var(--lacquer-1..3)`, and `pwa-assets.ts` repeats the stops as `LACQUER_STOPS` for resvg (`pwa-assets.test.ts` keeps them equal to `styles.css`).

### Cover tint

On record screens (record detail, Random pick, the record spotlight) the container sets `style={{ '--cover-tint': tint }}` and renders `<CoverGlow tint={tint} />` first; the `cover-glow` utility draws a faint radial glow plus a 2px tinted top edge.

- `useCoverTint` samples the **Deezer** Cover only: Discogs images send no CORS headers, so a canvas can't read them. No Deezer match → neutral.
- `dominantTint` (`src/shared/utils/cover-tint.ts`) picks the dominant hue and fixes lightness at 0.62 and chroma at ≤ 0.09: the cover sets the hue, never how loud it is. Grey when the cover has no clear colour.
- House sleeves get no tint.
- `--cover-tint` is a registered `<color>` (`@property`), so a new tint cross-fades from the last one (160ms) instead of jumping.
- A Random pick is prepared whole (`prepareRandomPick`): Cover decoded and tint sampled before the record screen shows, so cover, text and glow arrive in one fade.
- `cover-tint.test.ts` checks text contrast over the glow in both themes.

---

## 4. Shapes: square like a sleeve, round like a record

| Shape     | Radius                     | Applies to                                                                       |
| --------- | -------------------------- | -------------------------------------------------------------------------------- |
| Square    | `2px` (`--radius`)         | Covers, cards, surfaces, inputs, dialogs                                         |
| Round     | `rounded-full`             | Anything pressable or record-like: buttons, chips, scan button, avatars, loaders |
| Exception | `14px` (`rounded-t-sheet`) | Top corners of bottom sheets only                                                |

Why: a sleeve is a square of card, a record is a disc. Surfaces that hold things (covers, cards, sheets) read as sleeves; things you press or that spin read as records. Two shapes, each with a meaning, so a glance tells you what's tappable.

No in-between radius: the 8–12px "SaaS card" is exactly the look we're leaving. `src/feature-screens.test.ts` fails on `rounded-md` through `rounded-4xl` in feature screens.

shadcn derives every radius from one `--radius`, which can't express "square surfaces, round controls". So `--radius` is 2px and `rounded-full` is written into the definitions of `Button` and `Chip` (the scan button is a `Button`; add it to any future avatar). Don't round a surface at a call site; `rounded-lg` there just resolves to 2px.

---

## 5. Motion

Fast and quiet: fades by default, two signatures, nothing else.

| Motion                      | Duration                                         | Easing                                                 |
| --------------------------- | ------------------------------------------------ | ------------------------------------------------------ |
| Default (state, enter/exit) | 160ms opacity fade                               | `--ease-fade` = `cubic-bezier(.2,0,0,1)` (`ease-fade`) |
| Cover → detail              | 320ms open, 280ms close                          | `--ease-platter` = `cubic-bezier(.65,0,.15,1)`         |
| Groove loader               | ~800ms draw-in, short hold, loops (1100ms cycle) | platter                                                |
| Groove draw-in (landing)    | ~800ms draw-in, once                             | platter                                                |

**Signature 1 — cover → detail** (`src/shared/utils/cover-transition.ts`). The tapped Cover grows into the record screen's Cover and shrinks back on close. `setCoverOrigin` on tap, then `flyCover` animates a copy of the Cover above the sheet with the Web Animations API (transform only, no layout work) while the sheet just fades (`.sheet-fade`). The landing hero uses `growCover` for the same move inside one page.

**Signature 2 — groove loader** (`GrooveLoader`, `.groove-loader`). The spiral draws in from the outer edge like a needle, via `stroke-dashoffset` on a `pathLength="1"` path. Only on real waits — cold start (`AppShellPending`), long fetches — never as an added delay.

The same draw-in plays **once** on the landing (`.groove-draw-in`): in the hero's intro (text colour), and on the closing mark above "Bring your crates." (96px, lacquer tone). The closing mark stays undrawn (`.groove-undrawn`) until its section scrolls into view, then draws in and stops observing; it never replays during the page view.

Rules:

- No springs, no staggered list entrances, no crate-dig animation (Random pick is a plain fade).
- `prefers-reduced-motion`: every animation becomes a fade. Sheets fade instead of sliding, the loader shows the full groove and fades, the cover flight is skipped, the landing hero shows a still frame, the landing's closing groove fades in whole (`.groove-fade-in`).

---

## 6. Icons

### Custom (`src/shared/components/icons/`)

Seven icons in the groove's line language, built on `Icon`: 24px grid, 1.5 stroke, round caps and joins, `currentColor`. Same props as lucide, so the two swap freely. Decorative unless given `aria-label`. Paths come from `docs/brand/specimens/sillon-icons.html`.

| Icon                | Drawing                                        |
| ------------------- | ---------------------------------------------- |
| `HomeIcon`          | The groove mark itself                         |
| `CollectionIcon`    | A record half out of its sleeve                |
| `WantlistIcon`      | A dashed empty sleeve                          |
| `FulfilledWantIcon` | A closed sleeve holding a record               |
| `ScanIcon`          | A barcode spaced like grooves, in a viewfinder |
| `RandomPickIcon`    | A needle dropping onto a groove                |
| `SearchIcon`        | A lens with one groove                         |

These are the domain's own actions and places; they carry the brand.

### lucide

For generic actions only: back, close, more, add, sort, external link, theme, errors. A base rule in `styles.css` sets `.lucide { stroke-width: 1.5 }` to match the custom set. CSS beats the attribute, so to change a stroke use an inline style, not the `strokeWidth` prop.

Prefer a text label over an icon wherever there is room.

---

## 7. House sleeves

See `CONTEXT.md` → **House sleeve**. A generated Cover, shown when Deezer has no artwork for a record.

- `houseSleeve()` (`src/shared/utils/house-sleeve.ts`) is deterministic per Master: seeded (FNV-1a) by the cover key, or artist + title when there is none. Never by Release details, so every Release of a Master gets the same sleeve, and it never shows the catalogue number.
- Design space: 5 layouts (`band`, `block`, `rules`, `circle`, `stack`) × 4 greyscale compositions (`paper`, `vinyl`, `graphite`, `ash`) × 4 placements. Copper lacquer is the only brand material.
- Colours are fixed values, not theme tokens: a sleeve is an object and looks the same in light and dark.
- Typeset with the artist (small uppercase, letter-spaced) and title (display weight and tracking). Below ~88px it shows the title's initial instead (container query).
- **Loading state**: `coverState()` returns `loading` / `image` / `house`. While artwork may still arrive, show a flat `bg-muted` square; a House sleeve only once we know there is no artwork, so it never flashes.
- **Covers are Deezer only**, in lists and on record screens alike: Discogs images are community-uploaded, uneven and per-Release, so `CoverArt` never shows them. A record with no Deezer match gets the same House sleeve everywhere.
- Lookups are remembered in `localStorage` (`src/shared/utils/cover-cache.ts`): matches for good, "no match" for 30 days. Deezer failures are never remembered, so they don't pin a House sleeve.
- **Monogram**: artists without a Discogs Artist picture get their initials (`monogram()`, `src/shared/utils/monogram.ts`) in `type-display` on `bg-muted`. Records get House sleeves, artists get Monograms.
- The landing page uses the same generator with made-up artists and titles, so no third-party cover art appears on public pages.

---

## 8. The mark

**The groove**: one Archimedean spiral drawn from the outer edge inwards (starting at 12 o'clock, clockwise), round caps. No disc body, no label. `grooveSpiralPath()` in `src/shared/utils/groove-spiral.ts`; `<GrooveMark size tone label?>` renders it.

Turns and stroke depend on rendered size, so the groove stays legible:

| Size   | Turns         |
| ------ | ------------- |
| ≥ 90px | 9             |
| ≥ 48px | 6             |
| ≥ 30px | 4             |
| < 30px | 2.5 (favicon) |

Stroke is ~38% of the gap between grooves, with a floor (thicker below 24px).

Tones:

- `lacquer` — copper lacquer gradient on vinyl black. Brand surfaces only: app icon, launch screen.
- `current` (default) — `currentColor`. Header, loader, anywhere in the UI.

**Wordmark**: "sillon", lowercase, Familjen 700, tracking −0.055em (`<Wordmark>`).

---

## 9. PWA assets

All generated from the mark by `scripts/generate-pwa-assets.ts` (resvg). Specs live in `src/shared/utils/pwa-assets.ts` and `startup-images.ts`.

```bash
pnpm generate:pwa-assets   # re-run after changing the mark, lacquer stops or vinyl black
```

| File                                        | Size                                     | Notes                          |
| ------------------------------------------- | ---------------------------------------- | ------------------------------ |
| `public/favicon.svg` + `favicon.ico`        | 32 (ico: 16, 32, 48)                     |                                |
| `public/icons/icon-192.png`, `icon-512.png` | 192, 512                                 | `purpose: any`                 |
| `public/icons/icon-512-maskable.png`        | 512                                      | Mark inside the 80% safe zone  |
| `public/icons/apple-touch-icon.png`         | 180                                      | Opaque; iOS rounds the corners |
| `public/splash/apple-splash-*.png`          | one per current iPhone portrait viewport | Linked from `__root.tsx`       |
| `docs/brand/readme-banner-{light,dark}.png` | 1280×400                                 | README `<picture>`, see below  |

**README banner**: groove left, wordmark and tagline ("Your Discogs collection, cover first.") right; dark on vinyl black, light on `--background`. resvg can't read WOFF2 or pick a variable font's weight, so the text renders from static Familjen 400/700 TTFs in `scripts/fonts/`.

**The system launch screen is always dark** — vinyl black with the lacquer groove, whatever the theme. It is a static image the OS shows before any of our code runs, so it can't follow the in-app toggle, and an iOS startup image can't switch with the OS theme either. Dark is where the signature is strongest, and a dark flash before a light app is gentler than a white flash before a dark one. Android uses the manifest's `background_color` (`#0a0a0b`) + icon; iOS uses the `apple-touch-startup-image` PNGs.

Sillon's own loading screen (app shell, cold start) does follow the theme and uses the groove loader.

`theme-color` has light (`#f5f5f3`) and dark (`#0e0e0d`) variants via `media="(prefers-color-scheme: …)"`, mirroring `--background`.

---

## 10. Components

- shadcn (style `base-nova`) + Base UI + vaul for behaviour and accessibility; all styling rewritten. Primitives live in `src/shared/components/ui/`.
- `Button` variants: `default` (solid `--primary`), `outline`, `secondary`, `ghost`, `destructive`, `link`, `lacquer` (satin, brand moments only — see §3).
- `Chip`: round, active chip is solid foreground.
- Bottom sheets: `Drawer` (vaul); 14px top corners.
- Screens: `Page` wraps every screen's content (the landing page excepted): `max-w-270`, 16px gutters, `24px` below the Header on mobile, `40px` from `sm`. Set it there, never per route.
- Focus: a 2px `--foreground` outline on every control, both themes.

---

## 11. Voice

- English UI. The French name is the only French touch; the landing says it once: "_Sillon_ — French for the groove in a record." Manifest and `<html>`: `lang="en"`.
- Short, plain and knowledgeable, like a good record-shop clerk.
- No exclamation marks, no "Oops", no cute errors.
- Use the glossary terms exactly as in `CONTEXT.md` (Cover, Master, Release, Wantlist, Fulfilled want, House sleeve…).
