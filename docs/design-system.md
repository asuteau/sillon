# Sillon — Design System

## Stack

- Tailwind CSS v4
- shadcn/ui
- Syne (headings) + Geist (UI) + Geist Mono (metadata)
- Dual theme: dark/light via `prefers-color-scheme` + `.dark` class

---

## 1. Fonts

Fonts are self-hosted in `public/fonts/` — no third-party requests, works fully offline with the PWA.

Download the required `.woff2` files from Google Fonts or Vercel (Geist) and place them in `public/fonts/`:

```
public/fonts/
  syne-semibold.woff2      (600)
  syne-bold.woff2          (700)
  syne-extrabold.woff2     (800)
  geist-regular.woff2      (400)
  geist-medium.woff2       (500)
  geist-mono-regular.woff2 (400)
```

Declare them in `src/styles/globals.css` via `@font-face`:

```css
@font-face {
  font-family: 'Syne';
  src: url('/fonts/syne-semibold.woff2') format('woff2');
  font-weight: 600;
  font-display: swap;
}
@font-face {
  font-family: 'Syne';
  src: url('/fonts/syne-bold.woff2') format('woff2');
  font-weight: 700;
  font-display: swap;
}
@font-face {
  font-family: 'Syne';
  src: url('/fonts/syne-extrabold.woff2') format('woff2');
  font-weight: 800;
  font-display: swap;
}
@font-face {
  font-family: 'Geist';
  src: url('/fonts/geist-regular.woff2') format('woff2');
  font-weight: 400;
  font-display: swap;
}
@font-face {
  font-family: 'Geist';
  src: url('/fonts/geist-medium.woff2') format('woff2');
  font-weight: 500;
  font-display: swap;
}
@font-face {
  font-family: 'Geist Mono';
  src: url('/fonts/geist-mono-regular.woff2') format('woff2');
  font-weight: 400;
  font-display: swap;
}
```

No npm package needed for fonts.

### Typographic roles

| Role       | Font       | Usage                                 |
| ---------- | ---------- | ------------------------------------- |
| Display    | Syne 800   | Hero titles, large artist names       |
| Heading    | Syne 700   | Section titles, album names           |
| Subheading | Syne 600   | Labels, navigation                    |
| Body       | Geist 400  | Running text, descriptions            |
| UI         | Geist 500  | Buttons, badges, tags                 |
| Metadata   | Geist Mono | Years, cat numbers, durations, prices |

---

## 2. CSS Tokens (Tailwind v4 — `@theme`)

Place in `src/styles/globals.css`:

```css
@import 'tailwindcss';
@import 'tw-animate-css';

@custom-variant dark (&:is(.dark *));

@theme {
  /* ── Fonts ── */
  --font-display: 'Syne', sans-serif;
  --font-sans: var(--font-geist-sans), sans-serif;
  --font-mono: var(--font-geist-mono), monospace;

  /* ── Spacing scale ── */
  --spacing-18: 4.5rem;
  --spacing-22: 5.5rem;

  /* ── Border radius ── */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-full: 9999px;

  /* ── Color palette ── */

  /* Violet accent */
  --color-violet-50: #f3f1fe;
  --color-violet-100: #e9e6fd;
  --color-violet-200: #d5cffc;
  --color-violet-300: #b8adf8;
  --color-violet-400: #a89ef4;
  --color-violet-500: #8b7fe8; /* ← brand primary */
  --color-violet-600: #7b6fd8;
  --color-violet-700: #6558c0;
  --color-violet-800: #5247a0;
  --color-violet-900: #3d3478;

  /* Dark neutrals */
  --color-ink-950: #080809;
  --color-ink-900: #0d0d0f;
  --color-ink-800: #111114;
  --color-ink-700: #18181c;
  --color-ink-600: #222228;
  --color-ink-500: #2e2e36;
  --color-ink-400: #3f3f4a;
  --color-ink-300: #5a5a68;
  --color-ink-200: #7e7e8e;
  --color-ink-100: #a8a8b8;
  --color-ink-50: #d4d4de;

  /* Light neutrals */
  --color-mist-950: #0f0f10;
  --color-mist-900: #1a1a1c;
  --color-mist-50: #f8f8fa;
  --color-mist-100: #f0f0f4;
  --color-mist-200: #e4e4ea;
  --color-mist-300: #ccccd4;
  --color-mist-400: #aaaab6;

  /* Status */
  --color-success: #4ade80;
  --color-warning: #fbbf24;
  --color-error: #f87171;
}

/* ── Semantic tokens — Light (default) ── */
:root {
  /* Backgrounds */
  --background: var(--color-mist-50);
  --background-subtle: var(--color-mist-100);
  --background-raised: #ffffff;
  --background-overlay: rgba(0, 0, 0, 0.5);

  /* Surfaces (cards, modals) */
  --surface: #ffffff;
  --surface-raised: var(--color-mist-50);
  --surface-overlay: rgba(255, 255, 255, 0.8);

  /* Borders */
  --border: var(--color-mist-200);
  --border-subtle: var(--color-mist-100);
  --border-strong: var(--color-mist-300);

  /* Text */
  --text-primary: var(--color-mist-950);
  --text-secondary: var(--color-mist-400);
  --text-tertiary: var(--color-mist-300);
  --text-inverse: var(--color-mist-50);
  --text-on-accent: #ffffff;

  /* Accent */
  --accent: var(--color-violet-500);
  --accent-hover: var(--color-violet-600);
  --accent-subtle: var(--color-violet-100);
  --accent-foreground: var(--color-violet-900);

  /* shadcn compatibility */
  --card: var(--surface);
  --card-foreground: var(--text-primary);
  --popover: var(--surface);
  --popover-foreground: var(--text-primary);
  --primary: var(--accent);
  --primary-foreground: var(--text-on-accent);
  --secondary: var(--background-subtle);
  --secondary-foreground: var(--text-primary);
  --muted: var(--background-subtle);
  --muted-foreground: var(--text-secondary);
  --input: var(--border);
  --ring: var(--accent);
}

/* ── Semantic tokens — Dark ── */
.dark {
  /* Backgrounds */
  --background: var(--color-ink-900);
  --background-subtle: var(--color-ink-800);
  --background-raised: var(--color-ink-700);
  --background-overlay: rgba(0, 0, 0, 0.7);

  /* Surfaces */
  --surface: var(--color-ink-800);
  --surface-raised: var(--color-ink-700);
  --surface-overlay: rgba(13, 13, 15, 0.85);

  /* Borders */
  --border: var(--color-ink-600);
  --border-subtle: var(--color-ink-500);
  --border-strong: var(--color-ink-400);

  /* Text */
  --text-primary: var(--color-ink-50);
  --text-secondary: var(--color-ink-200);
  --text-tertiary: var(--color-ink-300);
  --text-inverse: var(--color-ink-900);
  --text-on-accent: #ffffff;

  /* Accent */
  --accent: var(--color-violet-500);
  --accent-hover: var(--color-violet-400);
  --accent-subtle: rgba(139, 127, 232, 0.12);
  --accent-foreground: var(--color-violet-200);

  /* shadcn compatibility */
  --card: var(--surface);
  --card-foreground: var(--text-primary);
  --popover: var(--surface);
  --popover-foreground: var(--text-primary);
  --primary: var(--accent);
  --primary-foreground: var(--text-on-accent);
  --secondary: var(--background-raised);
  --secondary-foreground: var(--text-primary);
  --muted: var(--background-subtle);
  --muted-foreground: var(--text-secondary);
  --input: var(--border);
  --ring: var(--accent);
}

/* ── Auto dark via system preference ── */
@media (prefers-color-scheme: dark) {
  :root:not(.light) {
    --background: var(--color-ink-900);
    --background-subtle: var(--color-ink-800);
    --background-raised: var(--color-ink-700);
    --background-overlay: rgba(0, 0, 0, 0.7);
    --surface: var(--color-ink-800);
    --surface-raised: var(--color-ink-700);
    --surface-overlay: rgba(13, 13, 15, 0.85);
    --border: var(--color-ink-600);
    --border-subtle: var(--color-ink-500);
    --border-strong: var(--color-ink-400);
    --text-primary: var(--color-ink-50);
    --text-secondary: var(--color-ink-200);
    --text-tertiary: var(--color-ink-300);
    --text-inverse: var(--color-ink-900);
    --text-on-accent: #ffffff;
    --accent: var(--color-violet-500);
    --accent-hover: var(--color-violet-400);
    --accent-subtle: rgba(139, 127, 232, 0.12);
    --accent-foreground: var(--color-violet-200);
    --card: var(--surface);
    --card-foreground: var(--text-primary);
    --popover: var(--surface);
    --popover-foreground: var(--text-primary);
    --primary: var(--accent);
    --primary-foreground: var(--text-on-accent);
    --secondary: var(--background-raised);
    --secondary-foreground: var(--text-primary);
    --muted: var(--background-subtle);
    --muted-foreground: var(--text-secondary);
    --input: var(--border);
    --ring: var(--accent);
  }
}
```

---

## 3. `components.json` (shadcn)

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "src/styles/globals.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "~/components",
    "utils": "~/lib/utils",
    "ui": "~/components/ui",
    "lib": "~/lib",
    "hooks": "~/hooks"
  },
  "iconLibrary": "lucide"
}
```

---

## 4. Tailwind utility patterns

### Semantic classes to compose

```
bg-[var(--background)]
bg-[var(--surface)]
text-[var(--text-primary)]
text-[var(--text-secondary)]
text-[var(--text-tertiary)]
border-[var(--border)]
bg-[var(--accent)]
text-[var(--accent-foreground)]
bg-[var(--accent-subtle)]
```

### Common snippets

```tsx
// Standard card
<div className="rounded-lg bg-[var(--surface)] border border-[var(--border)] p-4">

// Metadata badge (cat number, year)
<span className="font-mono text-xs text-[var(--text-tertiary)] tracking-wide">

// Section heading
<h2 className="font-display text-2xl font-bold tracking-tight text-[var(--text-primary)]">

// Secondary text
<p className="text-sm text-[var(--text-secondary)] leading-relaxed">

// Primary button → use shadcn Button variant="default"

// Accent focus ring
<div className="ring-1 ring-[var(--accent)] ring-offset-2 ring-offset-[var(--background)]">
```

---

## 5. Sillon-specific visual effects

### Ambient glow (hero, dark mode)

```css
.sillon-hero-glow {
  background: radial-gradient(
    ellipse 800px 500px at 50% -100px,
    rgba(139, 127, 232, 0.1) 0%,
    transparent 70%
  );
}
```

### Cover art shimmer (progressive loading)

```tsx
// Tailwind
<div className="animate-pulse bg-[var(--surface-raised)] rounded-sm aspect-square" />
```

### Vinyl spinning (detail page)

```css
@keyframes vinyl-spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
.vinyl-playing {
  animation: vinyl-spin 2s linear infinite;
}
.vinyl-paused {
  animation-play-state: paused;
}
```

### Cover overlay on hover

```tsx
<div className="group relative overflow-hidden rounded-sm">
  <img className="transition-transform duration-500 group-hover:scale-105" />
  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300 flex items-end p-3 opacity-0 group-hover:opacity-100">
    {/* metadata overlay */}
  </div>
</div>
```

---

## 6. Theme summary

```
                    Light         Dark
──────────────────────────────────────────────
background          #f8f8fa       #0d0d0f
surface             #ffffff       #111114
border              #e4e4ea       #222228
text-primary        #0f0f10       #d4d4de
text-secondary      #aaaab6       #7e7e8e
accent              #8b7fe8       #8b7fe8   ← same in both
accent-subtle       violet-100    violet/12% opacity
```

The accent is intentionally identical in light and dark — it's neutral enough to hold in both contexts.

---

## 7. Recommended shadcn components for Sillon

```bash
pnpm dlx shadcn@latest add button
pnpm dlx shadcn@latest add badge
pnpm dlx shadcn@latest add input
pnpm dlx shadcn@latest add dialog
pnpm dlx shadcn@latest add sheet          # mobile drawer
pnpm dlx shadcn@latest add command        # search
pnpm dlx shadcn@latest add tooltip
pnpm dlx shadcn@latest add skeleton
pnpm dlx shadcn@latest add separator
pnpm dlx shadcn@latest add avatar
pnpm dlx shadcn@latest add dropdown-menu
pnpm dlx shadcn@latest add tabs
```

Not needed: `calendar`, `date-picker`, `data-table` (virtualization handled manually).

---

## 8. Naming conventions

| Concept       | Location                 | Example                         |
| ------------- | ------------------------ | ------------------------------- |
| Route page    | `routes/_authenticated/` | `collection.tsx`                |
| Feature UI    | `components/sillon/`     | `CollectionGrid.tsx`            |
| UI primitive  | `components/ui/`         | shadcn auto-generated           |
| Sillon UI     | `components/sillon/`     | `VinylDisc.tsx`, `CoverArt.tsx` |
| Query options | `lib/queries/`           | `collectionQueries.ts`          |
| Server fn     | `lib/server/`            | `discogs.server.ts`             |
