# Sillon

Personal vinyl record collection app connected to Discogs.

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
- Motion: CSS + Web Animations API in the app; landing films use Motion + CSS 3D (ADR 0005)
- Discogs OAuth 1.0a — auth & collection data
- Deezer API — HD cover art
- Zod — schema validation at API boundaries

## Structure

```
src/
  routes/      ← file-based routing only, no logic
  features/    ← domain logic by feature
  services/    ← external connections (Discogs, Deezer, session)
  shared/      ← cross-feature components, hooks, utils
  styles.css   ← design tokens, type roles, motion
```

Imports use `#/` for `src/`.

## Docs

- `docs/conventions.md` — read before creating a file: folder and suffix for each role
- `docs/react-best-practices.md` — read before writing a component, hook or Effect
- `docs/design-system.md` — read before touching UI, motion or user-facing copy
- `CONTEXT.md` — read when naming a domain concept
- `docs/adr/` — read before changing dependencies, caching or money-related behaviour

## Agent skills

### Issue tracker

Issues tracked in GitHub Issues (asuteau/sillon) via `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Default canonical labels: needs-triage, needs-info, ready-for-agent, ready-for-human, wontfix. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context — root `CONTEXT.md` + `docs/adr/`. See `docs/agents/domain.md`.
