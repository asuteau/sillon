# Landing engine spike: Motion vs Remotion (#110)

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
