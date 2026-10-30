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
- It has two renderings of the same three stops: **sweep** for marks (icon, favicon, launch screen, the groove mark in lacquer tone — the landing hero film's groove and the closing mark above "Bring your crates." — House sleeve shapes) and **satin** for buttons. A mark too thin to carry the gradient (a Portrait Leader's bar or column) is **solid** stop 2, `--lacquer-2`: a sweep on a 3px bar just reads as an uneven colour, and stop 1 all but vanishes on light grounds.
- **No text on the sweep.** Text on lacquer always goes on a satin button.

How copper was chosen, in order (specimens in `docs/brand/specimens/`, open in a browser):

| Specimen                            | What it compares                                                                                                                                       | Outcome                                   |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------- |
| `sillon-lacquer-studies.html`       | 8 directions: silver (before), groove iridescence (Sheen, Prism, Oil slick), warm metal (Gold disc, Copper master), single-hue tints (Oxblood, Cobalt) | Shortlist Sheen, Gold disc, Copper master |
| `sillon-lacquer-finalists.html`     | The finalists plus Warm sheen, on every lacquer surface, with contrast figures and a cover-hue picker                                                  | Gold disc or Copper master                |
| `sillon-lacquer-buttons.html`       | 9 button paints in gold and copper: Sweep, Satin, Brushed, Grooved, Specular, Plate, Rim, Label on black, Solid                                        | Satin; Copper master                      |
| `sillon-lacquer-copper-middle.html` | Copper's middle stop, `#b06d4a` vs a lightened `#ba7a55`, on marks, sleeves and satin buttons                                                          | `#b06d4a`: stays ≥ 3:1 on light grounds   |

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

**Copper lacquer is for brand moments only**: app icon, launch screen, and the lacquer buttons (Random pick, Pick again, Scan, the landing CTA) — plus two non-interactive uses: the shapes on House sleeves, and each Portrait chart's Leader (solid `bg-(--lacquer-2)` on its bar or column; its count goes full-strength `text-foreground`, same size as the rest — never copper text, which is under 4.5:1 on light grounds). Never for hover, selection, focus or any general interactive state — that's what `--primary` and the neutrals are for. Buttons use `<Button variant="lacquer">` (satin); marks use `bg-(image:--lacquer)` (sweep). Satin and sweep are the same in light and dark: lacquer is a material, not a theme colour, so the dark blocks don't redefine it. Satin is derived from the stop tokens, so changing the stops updates both. SVG can't use a CSS gradient: `GrooveMark` builds a `<linearGradient>` from `var(--lacquer-1..3)`, and `pwa-assets.ts` repeats the stops as `LACQUER_STOPS` for resvg (`pwa-assets.test.ts` keeps them equal to `styles.css`).

### Cover tint

On record screens (`RecordScreen`, wherever a record opens from — Home, Random pick, Collection, Wantlist, Search) the container sets `style={{ '--cover-tint': tint }}` and renders `<CoverGlow tint={tint} />` first; the `cover-glow` utility draws a faint radial glow plus a 2px tinted top edge.

- `useCoverTint` samples the **Deezer** Cover only: Discogs images send no CORS headers, so a canvas can't read them. No Deezer match → neutral.
- `dominantTint` (`src/shared/utils/cover-tint.ts`) picks the dominant hue and fixes lightness at 0.62 and chroma at ≤ 0.09: the cover sets the hue, never how loud it is. Grey when the cover has no clear colour.
- House sleeves get no tint.
- `--cover-tint` is a registered `<color>` (`@property`), so a new tint cross-fades from the last one (160ms) instead of jumping.
- A Random pick and a Release opened from Search are prepared whole (`prepareRecordCover`): Cover decoded and tint sampled before the record shows, so cover, text and glow arrive in one fade. Search shows the groove loader in the record screen meanwhile; Marketplace prices may follow.
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

Fast and quiet: fades by default, three signatures, nothing else. The landing hero film strings the three together, with two easings of its own (below).

| Motion                      | Duration                                         | Easing                                                            |
| --------------------------- | ------------------------------------------------ | ----------------------------------------------------------------- |
| Default (state, enter/exit) | 160ms opacity fade                               | `--ease-fade` = `cubic-bezier(.2,0,0,1)` (`ease-fade`)            |
| Cover → detail              | 320ms open, 280ms close                          | `--ease-platter` = `cubic-bezier(.65,0,.15,1)`                    |
| Groove loader               | ~800ms draw-in, short hold, loops (1100ms cycle) | platter                                                           |
| Groove draw-in (landing)    | ~800ms draw-in, once, closing mark               | platter                                                           |
| Groove draw-in (Portrait)   | ~800ms draw-in, once, on reveal                  | platter                                                           |
| Reading state, groove fill  | 600ms glide per request; count rolls ~300ms      | platter                                                           |
| Sleeve pull                 | scroll-driven; timed moves 320ms                 | platter                                                           |
| Hero film, Pull (landing)   | 6.6s opening, once; then a 7.6s loop per record  | platter, fade; its own: out `(.16,1,.3,1)`, in-out `(.45,0,.1,1)` |

**Signature 1 — cover → detail** (`src/shared/utils/cover-transition.ts`). The tapped Cover grows into the record screen's Cover and shrinks back on close. `setCoverOrigin` on tap, then `flyCover` animates a copy of the Cover above the sheet with the Web Animations API (transform only, no layout work) while the sheet just fades (`.sheet-fade`). The landing hero film plays the same move as one of its own tracks (see Hero film).

**Signature 2 — groove loader** (`GrooveLoader`, `.groove-loader`). The spiral draws in from the outer edge like a needle, via `stroke-dashoffset` on a `pathLength="1"` path. Only on real waits — cold start (`AppShellPending`), long fetches — never as an added delay.

The same draw-in plays **once** on the landing: in the hero film's opening (lacquer tone, drawn by the film, see Hero film), and on the closing mark above "Bring your crates." (`.groove-draw-in`, 96px, lacquer tone). The closing mark stays undrawn (`.groove-undrawn`) until its section scrolls into view, then draws in and stops observing; it never replays during the page view.

**The reading state** (`ReadingState`, `.reading-state`, `.reading-groove`, `src/shared/utils/reading-state.ts`) is the groove loader holding a measure: a paced full read of a list (the Portrait's Collection read, later the Filters). The same spiral, outer edge in from 12 o'clock, over a faint full track of itself (14% `currentColor`); the drawn part is the share of records read (`stroke-dashoffset` on a `pathLength="1"` path), gliding 600ms platter at each request and closing exactly when the list is whole. `currentColor`, never lacquer. Undrawn, the path is hidden (a round cap would leave a dot). The readout: "Reading your collection" / "Reading your wantlist" (`type-caps`), the count in `type-catalogue` ("1,200 of 4,000", rolling to each new value over ~300ms) and "about N s left" (minutes from a minute on), from the Discogs requests left at the read's pace (`READ_PACE_MS`, `src/shared/utils/paced-read.ts`). Never a percentage. Two sizes: large (168px), centred in a page, readout stacked under it; small (30px), the readout beside it, the count and time left on one line (picker sheet, Portrait). It fades in after 1s, the router's default `pendingMs`, so a list read in one request (under 100 records) never flashes it. Exposed as a `progressbar` (value and "1,200 of 4,000" as its text); the readout itself is `aria-hidden`.

On the Portrait, the scan-based sections hold their place while the Collection is read (`PortraitHeldSections`): Top artists and Top styles as ten flat ranking rows, Pressing decade and Additions by year as flat columns on their baseline, all `--muted`, no pulse, like `SleevePullSkeleton`; the small reading state sits in the first section's top margin. Wholeness is unchanged — no figure before every Copy is read; the sections then fade in whole over the same space and their draw-ins play. A failed page keeps the retry line in its place.

The Portrait's ranking bars are the same draw-in, straightened: once, on reveal, from the start of the line (`.portrait-bar`), as their section fades in (`.portrait-reveal`). The time charts' columns (Pressing decade, Additions by year) draw up from the baseline the same way (`.portrait-column`). Every Portrait bar and column is neutral but the Leaders' (see §3): copper, nothing else changes — no larger type, which made the leading row a separate block. Entries tied for the most all lead; when every entry ties, none does.

**Signature 3 — Sleeve pull** (`SleevePull`, `.sleeve-pull-*`, `src/features/collection/sleeve-pull.ts`). Recent additions on Home: a strip of sleeves, 320px on desktop (edges faded with a mask), ≈60vw on a phone, capped at 28svh (never under 160px) below 640px wide, so short phones keep the Random pick prompt above the fold. The centred sleeve and its disc part around a shared centre — sleeve −20%, disc +20% of the sleeve width — so the pair stays centred; neighbours scale to 0.82 and dim. Scroll-driven, not timed: every frame, each slide's distance to the centre (`--pull-distance`, from the native scroll position) drives the pull, scale, dimming and the disc's turn, and native `scroll-snap` gives the momentum and settling. Timed moves (arrows, ←/→, a tapped neighbour, removal) glide over 320ms platter. Touch, trackpad, keys and the arrow buttons beside the caption (≥640px) move it; no mouse drag. Tapping the centred record opens its record screen with Signature 1: the disc tucks back during the flight and slides out again once the Cover has landed on close. Removing the centred record slides the next older one into the centre (the previous one if it was the last). The strip opens with the centred disc already out; it never plays an entrance. Until a slide's Cover is ready its disc stays the skeleton's flat disc, and the vinyl fades in with the Cover (300ms), so the vinyl never shows beside an empty sleeve. While Recent additions loads, the strip's own geometry stands in (`SleevePullSkeleton`): flat `--muted` sleeves, no shadow, no pulse, the centred one with a flat disc pulled out, a step off `--muted` (6% `--foreground`, no grooves or sheen; none under reduced motion, as the strip), with the caption's, attribution's and Random pick prompt's space held so nothing moves when the strip fades in over it in the same pose.

**Hero film — Pull** (`HeroAnimation`, `.hero-film-*`, `src/features/landing/landing.timeline.ts`). The landing hero: the groove becomes a disc, the disc pulls out of its House sleeve (Signature 3), the strip advances, and each Cover grows into its Record screen (Signature 1). Made-up records and House sleeves only, each disc in its Vinyl colour (`discSurface()`), each Record screen with its Disc count (`DiscRow`).

| Beat                 | Opening, once (ms) | Move                                                                                                     | Easing  |
| -------------------- | ------------------ | -------------------------------------------------------------------------------------------------------- | ------- |
| Groove draws in      | 250–1350           | Lacquer groove, turning from −40° as it settles                                                          | platter |
| Wordmark             | 850–1450           | Rises in under the groove                                                                                | out     |
| Groove → disc        | 1700–2500          | Groove and wordmark fade out; the disc fades in where the groove was                                     | out     |
| Sleeve slides in     | 2900–3900          | From off left, turned (rotateY 55°, −8°)                                                                 | out     |
| Disc tucks in        | 3200–3900          | Into the sleeve                                                                                          | in-out  |
| Pull                 | 4200–5000          | Sleeve −20%, disc +20% of the sleeve: the Sleeve pull's pose                                             | platter |
| Camera pulls back    | 5100–6400          | To the strip (scale 0.58); neighbours come in from beyond, together (5300–6300), at 0.82 and 0.5 opacity | platter |
| Caption, Random pick | 6000–6500          | Rise in (`SleevePullCaption`, the lacquer "Pick for me" button)                                          | out     |

Then the loop, one pass per record, four records taking turns (`HERO_CAST_SIZE`). It starts with the Record screen open; the opening joins it at 1800ms, on the strip. Loop beats (ms into the pass): the Cover shrinks back onto its sleeve as the screen fades to the strip (1000–1600, platter); the centred disc tucks back in (2000–2900) as the strip advances one slide (2300–3300, platter); the next disc pulls out (2700–3900) and its caption rises; the strip fades and the Cover grows from its sleeve into the Record screen's Cover (4500–5350, platter); the heading rises (5100–5700), then the disc row (5550–6150); hold to 7600. The records turn over while the Record screen hides the strip, so no swap is ever seen.

- Played with the Web Animations API: one animation per tracked element (`data-track`), transform and opacity only, plus the groove's `stroke-dashoffset`. Positions in `cqw` of the 4:5 stage, so the film scales with its column; the stage's layout (slide, groove, Record screen Cover) is set once in TS and handed to the CSS as `--hero-*` properties on the stage. React re-renders only at cues (opening → loop, a new pass), never per frame.
- Easings: platter and fade are `--ease-platter` and `--ease-fade`, copied into `landing.timeline.ts` since Web Animations can't read `var()` (a test keeps them equal to `src/styles.css`). The film adds two of its own, nowhere else in the app: out `(.16,1,.3,1)` for things settling in (wordmark, sleeve, disc, neighbours, caption) and in-out `(.45,0,.1,1)` for a disc tucking in.
- A disc out of its sleeve turns slowly (one turn per 1.9s, linear).
- Pauses off-screen and in a hidden tab, and resumes where it stopped.
- Frameless: no card or border; the strip's edges fade into the page (mask, 12%), and the Record screen's glow fades out before the stage's edges, with no tinted top edge.
- Reduced motion: one still, `HERO_STILL` (the opening's last frame, where the loop joins): the full Sleeve pull pose — the strip, the centred House sleeve with its disc pulled out in its Vinyl colour, the neighbours scaled down and dimmed, the caption and the Random pick button — no turn.

Home is laid out on the Sleeve pull's centre axis (`text-center` on Home's `Page`): the page title, the caption, the Discogs attribution and the Random pick prompt (`RandomPickPrompt`: question, subline, any error, button stacked, frameless — no card chrome) are all centred, at every width, including the loading and empty states. Home only; every other page title stays left-aligned.

**The disc** (`Disc`, `.disc-*`) is a brand object, like the mark: vinyl in the Release's Vinyl colour with fine grooves and a sheen, a label in the Cover tint (§3; grey for House sleeves, cross-fading from grey as the tint arrives), a printed line on the label so the turn shows, and a centre hole in `--background`. Square sleeve, round record (§4).

The disc's colour (`discSurface()`, `src/features/collection/disc-surface.utils.ts`) is drawn from the parsed Vinyl colour (CONTEXT.md) as static CSS gradients in `--disc-surface`; grooves and sheen stay on top, label and hole are unchanged, and nothing repaints per frame beyond the existing transforms. Unknown or unnamed → black. Same Release, same disc: splatter, marbling and blade angles are seeded by the Release id.

| Effect                 | Drawn as                                                                                                                                                                                                            |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Solid                  | The colour                                                                                                                                                                                                          |
| Translucent, clear     | The colour mixed with `transparent` (clear 35%, coloured 60%): the page shows through. A 1px rim and faint inner shade in `--foreground` keep the edge on either ground, whenever any of the colours is see-through |
| Splatter               | 12 drops with satellites in the named colours over the base (none named: black on light, white on dark)                                                                                                             |
| Marbled                | A soft conic swirl of base and veins plus elliptic smears; one colour → veins in black or white                                                                                                                     |
| Split                  | Hard-stop halves (thirds for three colours)                                                                                                                                                                         |
| Corona                 | The base at the centre, bleeding into a ring of the second colour out to the rim                                                                                                                                    |
| Ink spot               | Soft lobes of the second colour spreading from the centre                                                                                                                                                           |
| Propeller              | Hard-stop conic blades: each colour, or two colours twice                                                                                                                                                           |
| Twister                | Soft conic arms alternating two colours                                                                                                                                                                             |
| Yolk                   | A hard-edged centre disc of the second colour, the base as the rim                                                                                                                                                  |
| Etched                 | Fine radiating lines over the colour                                                                                                                                                                                |
| Hybrids (`*-splatter`) | The effect takes its first colours (split, yolk: two; marbled: one), the splatter the rest (none left: black or white drops)                                                                                        |
| Sparkle, pearl, glow   | Approximated overlays: glints of white, a faint iridescent conic, a pale green halo                                                                                                                                 |
| Picture disc           | The Cover on the disc, faint grooves over it                                                                                                                                                                        |

**The disc row** (`DiscRow`, `.disc-row*`) shows a Release's discs on the record screen, under the catalogue lines and above Marketplace: one Disc per disc (Disc count, CONTEXT.md), each in its own Vinyl colour, left to right in disc order, overlapping by 40%, disc 1 on top. 48px below 640px wide, 64px above; every disc the same size (7" and 10" are not told apart). At most four are drawn; beyond that, a `×N` count in the catalogue face follows them. Disc 1 is seeded by the Release id like the Sleeve pull's, so the two match; each next disc by the id plus its index, so a splatter set doesn't repeat itself. Static, no entrance of its own, and `aria-hidden`: the catalogue line already gives the format in words. No vinyl, no row.

Rules:

- No springs, no staggered list entrances, no crate-dig animation (Random pick is a plain fade).
- `prefers-reduced-motion`: every animation becomes a fade. Sheets fade instead of sliding, the loader shows the full groove and fades, the cover flight is skipped, the landing hero film shows one still (the Sleeve pull pose, disc pulled out), the landing's closing groove fades in whole (`.groove-fade-in`), Portrait bars and columns show whole as their section fades in. The reading state draws the same share in steps, without the glide, and its count jumps. Home's Sleeve pull keeps the disc in its sleeve and never shows it; neighbours still scale and dim (they follow the finger), removal cross-fades and the arrows jump. The landing's Sleeve pull poses (the hero's still, the Collection still) are stills, not motion: their disc stays pulled out.

---

## 6. Icons

### Custom (`src/shared/components/icons/`)

Eight icons in the groove's line language, built on `Icon`: 24px grid, 1.5 stroke, round caps and joins, `currentColor`. Same props as lucide, so the two swap freely. Decorative unless given `aria-label`. Paths come from `docs/brand/specimens/sillon-icons.html`.

| Icon                | Drawing                                        |
| ------------------- | ---------------------------------------------- |
| `HomeIcon`          | The groove mark itself                         |
| `CollectionIcon`    | A record half out of its sleeve                |
| `WantlistIcon`      | A dashed empty sleeve                          |
| `FulfilledWantIcon` | A closed sleeve holding a record               |
| `ScanIcon`          | A barcode spaced like grooves, in a viewfinder |
| `RandomPickIcon`    | A needle dropping onto a groove                |
| `SearchIcon`        | A lens with one groove                         |
| `PortraitIcon`      | A portrait frame holding one groove            |

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
