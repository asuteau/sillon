# Landing engine spike: Motion vs Remotion (#110)

> The spike pages (`/spike/engine`, `/spike/storyboard`) and `motion` were removed in #122. To run them, check out a commit before it, e.g. `41d4665`.

One ~10s shot built twice: camera push into a Cover while the disc slides out in its Vinyl colour, a light band sweeping the Cover. Same set (`ShotStage`: `GeneratedCover` + `Disc`/`discSurface`), same numbers and curves (`shot.timeline.ts`), two drivers.

## Run it

- `pnpm dev`, open `/spike/engine` (dev only; 404 in a production build). Toggle both / motion / remotion; light/dark with the page's theme button. Motion has a scrubber; Remotion's Player has its own controls.
- `pnpm spike:remotion` opens Remotion Studio on composition `HeroShot` (frame-accurate scrubbing, timeline, props).

## Comparison

|                                                | Motion (`animate()` sequence)                                             | Remotion (`@remotion/player` + Studio)                                                |
| ---------------------------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Model                                          | Declarative timeline of WAAPI animations, started once; browser runs them | Pure function of the frame: React re-renders every frame, values from `interpolate()` |
| Gzip added (esbuild, minified, React external) | 26.4 KB full `motion`; 3.3 KB `motion/mini` (WAAPI only, no sequences)    | 118 KB (`remotion` + `@remotion/player`)                                              |
| Prod bundle                                    | Not in the build (verified: no spike code in `.output`)                   | Same                                                                                  |
| 1x CPU, 390px DPR2                             | 60 fps, no long tasks                                                     | 60 fps, no long tasks                                                                 |
| 4x CPU throttle (10s, 2 runs)                  | 60 fps, max frame 33 ms                                                   | 33.5 and 36 fps, 3-7 frames over 34 ms                                                |
| 6x CPU throttle (10s)                          | 60 fps, no drops                                                          | 23.6 fps, 127 frames over 34 ms, 4 long tasks (204 ms)                                |
| Licence                                        | MIT                                                                       | Free for individuals, see below                                                       |

Smoothness caveat: this is **emulated** (Chrome DevTools CPU throttling on a desktop, mobile viewport), not a real phone. It models JS/main-thread slowness, not a mobile GPU, memory or thermal limits. Motion stays at 60 because WAAPI transform/opacity runs on the compositor, so a busy main thread can't drop it; the main thread was idle here, so this doesn't prove it under a busy page (real landing: React, images, scroll). Remotion drives every frame from React and degrades as the main thread slows; it skips frames to stay in real time. Measured with a rAF cadence probe plus `longtask` observer through the DevTools MCP; the DevTools trace (6x, Remotion) was recorded but its summary yielded no usable insights, so the numbers come from the probes. Remotion at 30 fps would halve its React work (not measured).

## Craft

- **Camera push**: Both easy. Remotion: one `interpolate` of scale. Motion: one segment. Gotcha for Motion/WAAPI: two tweens on one element's `transform` replace each other, so push and pan needed two nested layers (Remotion computes the whole transform in one function and has no such problem).
- **Easing**: Motion takes cubic-bezier arrays directly and the sequence `at` places segments; Remotion needs `Easing.bezier(...)` per `interpolate`. Equal results; the shared curves matched by eye.
- **Light sweep**: Both trivial (translated gradient). Motion needs three segments (translate, fade in, fade out); Remotion multiplies two ramps in a function. Remotion's per-frame model is easier for values that depend on each other.
- **Scrubbing**: The real difference. Remotion is built for it: Studio gives a frame-accurate timeline, any frame is a pure render, and the same composition renders to MP4 if wanted. Motion scrubs through `controls.time`, fine for a debug slider, but no timeline UI, no frame stepping.
- **Existing hero film**: it is WAAPI already (`landing.timeline.ts`); Motion would mostly replace its hand-rolled scheduler (`use-hero-playback`) with sequences. Remotion would mean rewriting it as frame functions.
- **Theming**: Player renders in the page DOM, so light/dark and the Tailwind tokens just work. Studio needed webpack: `@remotion/tailwind-v4` plus a `url()` filter so the CSS font paths in `styles.css` resolve (`remotion.config.ts`).

## Iteration speed

- Motion: Vite HMR, remount shows the change in about a second; edit numbers in `shot.timeline.ts` or the sequence. No new tool.
- Remotion: Player in the app also HMRs; Studio is a second dev server (webpack, ~3s build, own port) with scrubbing, which makes timing tweaks faster, but you work in two tools. Remotion packages must all share one exact version.

## Licence

Remotion's licence (read in `node_modules/remotion/LICENSE.md`, v4.0.545): free for individuals, for-profit orgs up to 3 employees, and non-profits; evaluation also free. The stated permission is "for the purpose of creating videos and images"; it does not say whether runtime Player use in an app counts, but the Player is Remotion's documented in-app use. Sillon is a personal, non-monetised project (ADR 0003), so it falls in the free tier. The notice says the licence changes in Remotion 5.0 (not checked in detail), so re-read it on a major bump. Motion is MIT, no conditions.

## ADR 0002

Both added to `devDependencies` with caret ranges (spike only): `motion ^14.14.0`, `remotion`, `@remotion/player`, `@remotion/cli`, `@remotion/tailwind-v4` all `^4.0.545`. If either ships, it moves to `dependencies`. Remotion wants identical versions across its packages; a caret range could drift them, so shipping it likely means exact pins.

## Recommendation (user decides)

For a hero that plays on a phone and only needs to look right: **Motion**, probably `motion/mini` (3 KB) or full `motion` for sequences (26 KB), 60 fps under throttle, no licence terms, close to what the hero already does. Remotion buys frame-accurate scrubbing in Studio and video export, at ~118 KB gz, a React render per frame, visible frame loss at 4x-6x, and a custom licence. Pick Remotion only if the Studio workflow (scrubbing, rendering a video from the same composition) matters more than phone smoothness and weight. Next step either way: ADR 0005 for the chosen engine, real-phone check before shipping.

---

# Craft spike: DOM vs WebGL (#110, round 2)

Why: the shots above were flat 2D tweens and read like UI, not motion design. The spec allows WebGL only if the DOM can't reach the bar; this round decides that. The same ~10s shot, built twice to a cinematic bar: a camera with weight pushes into the hero Cover while its disc slides out in its Vinyl colour, turning, a key light sweeping across, rack focus from the far sleeves to the Cover to the disc.

Remotion is dropped from the code and the dependencies (its findings above stand; `pnpm spike:remotion` and `remotion.config.ts` are gone). The prior flat Motion shot stays on the page as "Prior flat", for comparison.

## Run it

`pnpm dev`, open `/spike/engine` (dev only, client-rendered; the production build ships a 135-byte route stub). Toggle A + B / A · DOM / B · WebGL / Prior flat, 16:9 / 4:5, light/dark with the theme button. One clock drives both, so side by side they play the same frame; Pause and the scrubber drive both. URL: `?view=dom|webgl|both|flat&framing=wide|tall&t=<ms>` (opens paused on a frame), `&post=0` (WebGL without post-processing), `&webgl=0` (forces the no-WebGL fallback). `window.shotClock` is exposed for probes.

## One score, two renderers

- `craft.score.ts`: the shot as a pure score in world units (1 = a 12" sleeve): the set (four sleeves of the made-up cast, the hero with its disc), a camera rig (target, orbit yaw/pitch, dolly distance, dutch roll, field of view per framing), the beats as eased tracks, a deterministic handheld wander that opens up in the final hold, the focus point and aperture, the key light, and the reduced-motion still (`STILL_MS`). `sampleShot(ms, framing)` returns a pose. No DOM, no three.
- 16:9 and 4:5 are two rigs, re-framed not scaled: 4:5 uses a longer lens and ends on the disc, the sleeve cropped by the frame.
- A bakes the score; B samples it every frame. Same curves, same timings, same lens maths (`confusion()`, a thin-lens circle of confusion).

## A · DOM: CSS 3D + Motion

`DomShot.tsx`, `dom-bake.ts`. A real CSS 3D set under one `perspective` derived from the lens (P = h/2 / tan(fov/2)), the world transformed as the inverse camera (dolly, orbit, tilt, roll). Sleeves are boxes with thickness (printed front, edges, the dark open mouth); the disc is three stacked layers with the existing `Disc` on top. The page ground is the floor, with contact shadows and soft cast shadows that move away from the key light. `bakeDom()` samples the score at 30 Hz (301 keyframes per track, ~5 ms) into per-part keyframes; Motion plays them as one `animate()` sequence of WAAPI animations (transform, filter, opacity), linear between samples, so the browser runs them and the curves are the score's own.

- Depth of field: per object, `filter: blur()` from the circle of confusion of its centre, applied per face (a filter flattens `preserve-3d`, so it goes on the leaves). The rack focus far sleeves → Cover → disc reads clearly.
- Light: Lambert shading per face from the key direction (an overlay per face). The Cover's sheen is the reflection of a tall strip softbox, placed by real mirror geometry, so it crosses the Cover around 5–6.5s as the key and the camera move. The disc's streak is a light-locked bow-tie (bright conic, dark quadrants) outside the turn, rotated toward the light's reflection, with a blurred plus-lighter copy as bloom.
- Camera weight: the dolly is slow off the mark, goes a touch past and settles back; handheld drift in the hold; a fade up from the page ground; edges masked into the page (frameless).
- Motion blur: approximated, the disc's speed on screen adds to its blur (isotropic).

What the DOM can't do, seen in this build:

- Depth of field is per element: one blur for a whole plane, so a sleeve at an angle is evenly soft, not sharp at its near edge and soft at its far one; no bokeh; blur can't spill over an edge in front of it.
- Light is faked: flat shading per face, no falloff across a surface, no real reflections (the gloss and the groove streak are art-directed gradients placed by the maths), no shadow of the disc on the sleeve.
- No directional motion blur (only isotropic); the disc's thickness is stacked layers that alias at grazing angles; edges of blurred 3D layers can alias.
- Cost: every blurred face is a filtered layer repainted as its blur changes; at 6× CPU the rAF cadence halves (still no long tasks).

## B · WebGL: three.js + react-three-fiber

`GlShot.tsx`, `lens-blur.ts`, `cover-canvas.ts`. A perspective camera on the same rig. Sleeves are boxes: the front a `MeshPhysicalMaterial` with clearcoat and the Cover painted on a canvas texture (`paintCover()`, a port of `coverArt()`: same seed, same draws, same shapes and type). The disc is a cylinder with a canvas face (Vinyl colour, groove rings, label in the Cover tint, hole), a matte label by roughness map, and a groove anisotropy map (brushed along the grooves) so the key light draws the bow-tie streak physically. A shadow-mapped (VSM) directional key on the score's path, a hemisphere fill per theme, drei `Environment` re-rendered each frame with `Lightformer`s, one of them the key's strip softbox, so the Cover's coat reflects the sweep for real. Post: a custom single-pass depth of field (scatter-as-gather on a golden-angle spiral) driven by the same lens maths, and bloom.

- What it gets that A can't: depth of field per pixel (a tilted sleeve goes from sharp to soft across its face, foreground blur spills correctly), real anisotropic grooves, real reflections of a moving softbox, real cast shadows.
- What it cost: postprocessing's stock `DepthOfField` haloed the type and coloured the edges and had to be replaced by a hand-written shader. The lighting is physical, so the look had to be found (first passes were blown out or flat); the tangerine disc reads more copper than orange under the specular boost the streak needs; it needs a per-theme light rig (the dark opening is still underexposed). The Cover type must be repainted into its texture once the font loads. No motion blur (postprocessing has none). Complex Vinyl colours (splatter, marbled) would need a canvas port of `discSurface()` too (only solid colours here).

## Numbers

Bundle: esbuild, minified, React external, gzip -9, each variant bundled from its component; 15.9 KB of each is app code the landing already ships (`GeneratedCover`, landing content, `coverArt`, `Disc`, vinyl colour utils) and is subtracted.

Smoothness: rAF cadence probe (10s from the shot's start) plus a `longtask` observer, through the DevTools MCP, 390×844 DPR 2 mobile viewport, 4:5 framing, dev server. **Emulated**: CPU throttling on a desktop (display at 144 Hz, so 1× tops out near 144 fps, not 60), GPU an Intel Iris Xe (integrated, laptop). No mobile GPU, memory or thermals: WebGL's GPU cost in particular is not represented, and a mid-range phone GPU is weaker than this one.

|                                 | A · DOM (CSS 3D + Motion)                                                | B · WebGL (three.js / R3F)                                                          |
| ------------------------------- | ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| Gzip added                      | ~30 KB (`motion` ~26 KB, spike code ~4 KB)                               | ~311 KB (three, R3F, drei Environment/Lightformer, postprocessing)                  |
| Prod bundle                     | none (dev route stub, 135 B)                                             | none (lazy chunk of the dev route)                                                  |
| 1× CPU                          | 141.7 fps, 0 frames > 34 ms, max 21 ms, 0 long tasks                     | 36.8 fps, 56 frames > 34 ms, max 111 ms, 0 long tasks                               |
| 4× CPU                          | 111.7 fps, 0 > 34 ms, 0 long tasks                                       | 33.3 fps, 109 > 34 ms, 0 long tasks                                                 |
| 6× CPU                          | 64.4 fps, 2 > 34 ms, max 56 ms, 0 long tasks                             | 32.0 fps, 149 > 34 ms, 1 long task (58 ms)                                          |
| 1× CPU, no post (`post=0`)      | —                                                                        | 62.8 fps, 0 > 34 ms                                                                 |
| Time to play (dev server, warm) | 1.79 s to Motion started (dev module loading dominates); the bake ~5 ms  | 1.80 s to the first frame, 241 ms of it the first render (shader compile, textures) |
| Reduced motion                  | the still at `STILL_MS` (8.4s: disc out, light across it), nothing plays | the same still, the canvas renders on demand only                                   |
| No WebGL                        | n/a                                                                      | falls back to A (`?webgl=0`)                                                        |

Reading: A is light on the main thread (WAAPI) and stays above 60 fps even at 6×; its cost is painting the blurred layers, which this probe only sees indirectly. B is GPU-bound already at 1× on a laptop iGPU: the post (depth of field up to ~16 px × DPR 2, bloom) halves the frame rate; without post it holds ~63 fps. On a phone it would need a lower DPR, half-resolution depth of field, a baked environment and probably no shadow map: less of what makes it better.

## Dependencies (ADR 0002)

Added to `devDependencies`, caret ranges, spike only: `three ^0.187.0`, `@types/three ^0.187.0`, `@react-three/fiber ^9.8.2`, `@react-three/drei ^10.7.9`, `@react-three/postprocessing ^3.2.2`, `postprocessing ^6.39.6`. Removed: `remotion`, `@remotion/player`, `@remotion/cli`, `@remotion/tailwind-v4`. `motion` stays.

## Risks

- A: blur filters on many 3D layers are the expensive part on low-end GPUs (not measured on a phone); Safari's CSS 3D sorting and filters inside 3D must be checked (only Chrome tested); the baked keyframes depend on the stage size, so the film re-bakes on resize (~5 ms).
- B: ~10× the bundle; GPU cost unknown on a real phone and already under 60 fps here; WebGL context loss and no-WebGL need the DOM film anyway (two renderers to maintain); the look depends on a hand-written lens shader and a tuned light rig; the Cover and disc art need canvas ports of `coverArt()`/`discSurface()` that can drift from the CSS originals (they should then share one shape model); text in textures softens close up.
- Both: dev-only measurements, desktop Chrome only; a real mid-range phone check is still owed before shipping.

## Recommendation (user decides)

A reaches the bar for this shot: with a real camera rig, parallax, rack focus, light tied to geometry and contact shadows it reads as motion design, not UI, and it keeps the spec's constraints (transform/opacity/filter, ~30 KB, smooth under throttle, theme tokens for free). B is more physically right (per-pixel focus, real grooves and reflections) but not visibly better enough to pay ~311 KB, a GPU-bound frame rate and a DOM fallback anyway. Suggest: ship A's approach (a pure score baked to WAAPI keyframes, played by Motion), and take from B only ideas (the strip-softbox sweep, the lens maths). Next: the engine ADR, then a real-phone check of A's blur cost.
