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
- Motion is used only for `animate()` sequences of WAAPI animations. Its React components (`motion.div`, layout animations) are not used.
- The baked keyframes depend on the stage's size, so a film re-bakes on resize (~5 ms).
- Owed before the hero ships: a real mid-range phone check of the blurred 3D layers (the expensive part), and Safari's sorting and filters inside 3D (only Chrome was tested).
