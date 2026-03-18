# Sillon

Vinyl record collection app. TanStack Start + React + Tailwind v4.
Connects to Discogs (OAuth 1.0a) and Deezer (HD covers).

## Key docs

- `docs/roadmap.md` — phased development plan, read before starting any phase
- `docs/design-system.md` — CSS tokens, color palette, typography

## Current phase

Phase 1 — scaffold only, no UI dependencies yet.

## Important conventions

- Server-only code: `*.server.ts` suffix
- Session via `@tanstack/react-start/server` useSession, token never exposed client-side
- pnpm only
