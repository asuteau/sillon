# Sillon

Personal vinyl record collection app connected to Discogs.
Built with TanStack Start — migrated from Remix.

## Commands

```bash
pnpm dev                          # Start dev server
pnpm build                        # Production build
pnpm lint:fix && pnpm typecheck   # Run after every code change
```

## Stack

- TanStack Start + TanStack Router (file-based) + TanStack Query
- Tailwind CSS v4 + shadcn/ui
- Framer Motion
- Discogs OAuth 1.0a — auth & collection data
- Deezer API — HD cover art
- Zod — schema validation at API boundaries

## Structure

```
src/
  routes/      ← file-based routing only, no logic
  features/    ← domain logic by feature (schema, model, queries, utils, components)
  services/    ← external connections (discogs.server.ts, deezer.server.ts, session.server.ts)
  shared/      ← cross-feature components, hooks, utils
  styles/      ← globals.css, design tokens
```

## Current phase

Phase 3 — Core features (collection, search, wantlist).
Auth (Phase 2) is complete.

## Docs

**IMPORTANT:** Before starting any task, identify which docs below are relevant and read them first. Do not start writing code before loading the right context.

- `docs/roadmap.md` — full phased plan, file conventions (section 3.7), architecture decisions
- `docs/react-best-practices.md` — apply every rule to every component generated
- `docs/design-system.md` — CSS tokens, typography, theming, shadcn config
