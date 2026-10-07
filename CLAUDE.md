# Sillon

Personal vinyl record collection app connected to Discogs.
Built with TanStack Start — migrated from Remix.

## Commands

```bash
pnpm dev                          # Start dev server
pnpm build                        # Production build
pnpm test                         # Run tests (vitest)
pnpm check && npx tsc --noEmit    # Run after every code change (prettier + eslint fix, typecheck)
```

## Stack

- TanStack Start + TanStack Router (file-based) + TanStack Query
- Tailwind CSS v4 + shadcn/ui (style `base-nova`, Base UI + vaul)
- Familjen Grotesk + Martian Mono, self-hosted in `public/fonts/`
- Motion: CSS + Web Animations API (no animation library)
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
  styles.css   ← design tokens, type roles, motion
```

## Current phase

Phase 3 — Core features (collection, search, wantlist).
Auth (Phase 2) is complete.

## Docs

**IMPORTANT:** Before starting any task, identify which docs below are relevant and read them first. Do not start writing code before loading the right context.

- `docs/roadmap.md` — full phased plan, file conventions (section 3.7), architecture decisions
- `docs/react-best-practices.md` — apply every rule to every component generated
- `docs/design-system.md` — brand identity: tokens, type, shapes, motion, icons, House sleeves, mark, PWA assets, voice

## Agent skills

### Issue tracker

Issues tracked in GitHub Issues (asuteau/sillon) via `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Default canonical labels: needs-triage, needs-info, ready-for-agent, ready-for-human, wontfix. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context — root `CONTEXT.md` + `docs/adr/`. See `docs/agents/domain.md`.
