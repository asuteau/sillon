# Landing films are CSS 3D, played by Motion

The landing's films (the hero and the feature loops, #109) are built in the DOM: a CSS 3D set under one `perspective`, the camera as the world's inverse transform. Each film is a pure score of beats over time (`sampleShot(ms, framing)` returns a pose); it is sampled at 30 Hz into WAAPI keyframes (transform, opacity, filter), linear between samples, and `motion` plays them as one `animate()` sequence. The browser runs the animations, so the main thread does nothing per frame. This reverses #92's "no animation library: WAAPI + CSS" for the landing: `motion` is now a dependency, `^14.14.0` per ADR 0002. We chose this because it reached the cinematic bar in the spike (camera with weight, parallax, rack focus, light tied to geometry, contact shadows, a jacket with thickness) at a fraction of the alternatives' cost, and stays smooth when the CPU is throttled.

The numbers come from the #110 spike (`docs/research/landing-engine-spike.md`). Emulated in Chrome, not on a real phone: 390×844 at DPR 2, CPU throttled, a laptop iGPU. Bundle sizes are gzip, minified, React external.

|                                             | Gzip added                    | 4× CPU                       | 6× CPU                       |
| ------------------------------------------- | ----------------------------- | ---------------------------- | ---------------------------- |
| Motion, flat 2D shot                        | 26.4 KB (`motion`)            | 60 fps, max frame 33 ms      | 60 fps, no drops             |
| Remotion (`@remotion/player`)               | 118 KB                        | 33.5–36 fps                  | 23.6 fps, 4 long tasks       |
| **CSS 3D + Motion (chosen)**                | ~30 KB (`motion` + film code) | 111.7 fps, 0 frames > 34 ms  | 64.4 fps, 2 frames > 34 ms   |
| WebGL (three.js, R3F, drei, postprocessing) | ~311 KB                       | 33.3 fps, 109 frames > 34 ms | 32.0 fps, 149 frames > 34 ms |

The first two rows come from the spike's first round, capped at 60 fps; the last two from its craft round, on a 144 Hz display, so only rows of the same round compare frame rates directly. WebGL ran at 36.8 fps even unthrottled (62.8 fps without its post-processing): it is GPU-bound already on a laptop.

## Considered Options

- **Motion, flat 2D tweens**: rejected. Light and smooth, but scale, slide and a gradient sweep read as UI, not motion design: no camera, no depth, no light. Its engine survives; only the staging was too flat.
- **Remotion**: rejected. Frame-accurate scrubbing in Studio and video export, but a React render per frame drops frames as the main thread slows (23.6 fps at 6×), 118 KB, every Remotion package pinned to one exact version, and a custom licence (free for individuals, changes in 5.0).
- **CSS 3D + Motion**: chosen. See above.
- **WebGL (three.js / react-three-fiber)**: rejected. Physically better (per-pixel depth of field, real reflections, anisotropic grooves, cast shadows), but not visibly better enough to pay ~10× the bundle, a GPU-bound frame rate, canvas ports of `coverArt()` and `discSurface()` that can drift from the CSS originals, and a DOM fallback for no-WebGL and context loss anyway.

## Consequences

- The films stay transform, opacity and filter driven (plus `stroke-dashoffset` where the groove draws). No WebGL, no canvas renderer, no per-frame React. A future film needing more goes through a new ADR.
- Every curve lives in the score as cubic-bezier tracks; the engine only plays what the score sampled. Scores stay pure and tested without a browser, and give each film its reduced-motion still.
- **No springs.** Motion's springs are not used, in the films or in the app. A spring is physics run outside the score: it can't be sampled into the still, scrubbed or tested like the rest. A camera's weight (slow off the mark, a touch past, settling back) is written as score keys. The app keeps its fixed easings (design system §5).
- Motion is used only for `animate()` sequences of WAAPI animations. Its React components (`motion.div`, layout animations) are not used. Superseded: the browser plays the films directly (amendment below).
- The baked keyframes depend on the stage's size, so a film re-bakes on resize (~5 ms).
- Owed before the hero ships: a real mid-range phone check of the blurred 3D layers (the expensive part), and Safari's sorting and filters inside 3D (only Chrome was tested).

## Amendment: the browser plays the films, not Motion (#115, #116)

Building the hero film (about 270 tracked elements under one camera) showed two costs the spike's single shot hid. Measured on a production build, 390×844 at DPR 2, Chrome, CPU throttled, the film playing:

- **Motion's frame loop.** With every film handed to Motion's `animate()`, its frame loop ran each frame (~5.8 ms of script at 4×) and every frame then recalculated the style of every animated element: the main thread was ~85% busy (≈850 ms per second) and Chrome presented ~46 frames a second. Handing the same keyframes to `Element.animate()` directly left the main thread idle while the film plays (≈80 ms per second at 4×, ≈160 ms at 6×).
- **Animated blur.** `filter: blur()` moves pixels, so Chrome can't run its animation on the compositor: every film animating a blur had main-thread animation frames. The hero animates no blur: out of focus is a **soft twin** of a face (the same print under a static blur), faded in by opacity.

So:

- The player (`useFilmPlayer`) plays each part with the Web Animations API, one animation per tracked element, `fill: both`, `iterations: Infinity` for a loop. Motion is no longer used by the landing; `motion` stays a dependency only for the spikes (`src/features/engine-spike`, `src/features/storyboard-spike`) until they are removed, then goes.
- A part is baked in slices between frames (`bakeInSteps`), and the samples the browser would draw anyway (holds, straight runs within a fiftieth of a unit) are dropped (`withoutHolds`): fewer keyframes start faster. A film is baked and played only when it's on screen and the tab visible.
- `--film-undrawn` (a stroke's draw) is registered with `@property`, so the Web Animations API interpolates it; it still runs on the main thread, as before.
- Films animate transform and opacity only. A blur is static, or it's a soft twin.

The hero's numbers after the change (390×844, DPR 2, steady state while the film plays): 4× CPU, ≈61 frames presented a second, main thread ≈80 ms busy a second; 6× CPU, ≈62 frames a second, ≈160 ms. The cost moved to the start: the hero bakes in slices for ~2 s (4×) before it fades up, then one ~0.4 s task creates its animations. The real mid-range phone check and the Safari check this ADR owes are still owed.
